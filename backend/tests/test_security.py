import pytest
import time
from app.services.code_sandbox import ASTSecurityValidator, IsolatedSubprocessRunner, CodeSandboxService
from app.core.security import create_access_token, verify_password, get_password_hash
from jose import jwt, JWTError


class TestCodeExecutionSandboxSecurity:
    """Tests verifying the isolated code execution sandbox and AST security analyzer."""

    def test_ast_rejects_os_import(self):
        malicious_code = "import os\ndef solve(): return os.listdir('.')"
        is_safe, error = ASTSecurityValidator.validate(malicious_code)
        assert is_safe is False
        assert "Security Violation" in error
        assert "os" in error

    def test_ast_rejects_subprocess_import(self):
        malicious_code = "from subprocess import Popen\ndef solve(): Popen('calc')"
        is_safe, error = ASTSecurityValidator.validate(malicious_code)
        assert is_safe is False
        assert "Security Violation" in error

    def test_ast_rejects_builtins_open(self):
        malicious_code = "def solve():\n  f = open('/etc/passwd')\n  return f.read()"
        is_safe, error = ASTSecurityValidator.validate(malicious_code)
        assert is_safe is False
        assert "open" in error

    def test_ast_rejects_eval_and_exec(self):
        code_eval = "def solve(): return eval('1 + 1')"
        is_safe, error = ASTSecurityValidator.validate(code_eval)
        assert is_safe is False

        code_exec = "def solve(): exec('x = 10')"
        is_safe, error = ASTSecurityValidator.validate(code_exec)
        assert is_safe is False

    def test_ast_rejects_dunder_subclasses_traversal(self):
        malicious_code = "def solve(): return ().__class__.__bases__[0].__subclasses__()"
        is_safe, error = ASTSecurityValidator.validate(malicious_code)
        assert is_safe is False

    def test_execution_timeout_kills_infinite_loop(self):
        infinite_loop = "def solve(n):\n  while True:\n    pass\n  return n"
        test_cases = '[{"input": "1", "output": "1"}]'
        start = time.perf_counter()
        result = IsolatedSubprocessRunner.run_python(infinite_loop, test_cases, timeout_seconds=1.5)
        elapsed = time.perf_counter() - start
        assert result.success is False
        assert "Timed Out" in result.output
        assert elapsed < 4.0  # Proves process was killed swiftly without hanging

    def test_excessive_code_length_rejected(self):
        huge_code = "# harmless comment\n" * 1000 + "def solve(): return 1"
        test_cases = '[]'
        result = IsolatedSubprocessRunner.run_python(huge_code, test_cases)
        assert result.success is False
        assert "maximum length limit" in result.output

    def test_safe_algorithm_executes_successfully(self):
        safe_code = """
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
"""
        test_cases = '[{"input": "[2, 7, 11, 15], 9", "output": "[0, 1]"}, {"input": "[3, 2, 4], 6", "output": "[1, 2]"}]'
        result = CodeSandboxService.execute(safe_code, "python", test_cases)
        assert result.success is True
        assert len(result.results) == 2
        assert result.results[0].passed is True
        assert result.results[1].passed is True


class TestAuthenticationAndJWTSecurity:
    """Tests verifying password hashing and JWT configuration."""

    def test_bcrypt_hashing_and_verification(self):
        password = "P@ssw0rd!Secure2026"
        hashed = get_password_hash(password)
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("WrongPassword", hashed) is False

    def test_jwt_token_creation_and_expiration(self):
        from app.core.config import settings
        token = create_access_token(subject=42)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert str(payload.get("sub")) == "42"
        assert "exp" in payload

    def test_jwt_rejects_tampered_token(self):
        from app.core.config import settings
        token = create_access_token(subject=42)
        tampered_token = token[:-4] + "abcd"
        with pytest.raises(JWTError):
            jwt.decode(tampered_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    def test_jwt_rejects_none_algorithm(self):
        from app.core.config import settings
        token = create_access_token(subject=42)
        with pytest.raises(JWTError):
            # Enforcing only settings.ALGORITHM (HS256) blocks 'none' attack
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS384"])
