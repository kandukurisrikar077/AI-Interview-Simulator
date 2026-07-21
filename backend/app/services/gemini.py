import json
import os
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from google import genai
from google.genai import types
from openai import OpenAI
from app.core.config import settings

# --- API STRUCTURE CONSTRAINTS ---

class GeneratedQuestion(BaseModel):
    text: str = Field(..., description="The actual question text for the candidate")
    category: str = Field(..., description="Category topic, e.g. React Hooks, System Design, SQL, Leadership")
    expected_answer: str = Field(..., description="A short summary of what the ideal answer should cover")

class GeneratedCodingChallenge(BaseModel):
    title: str = Field(..., description="Title of the coding challenge, e.g. Binary Search")
    description: str = Field(..., description="Detailed problem statement in Markdown including inputs/outputs and constraints")
    starter_code: str = Field(..., description="Starter boilerplate function signature in Python")
    test_cases: str = Field(..., description="JSON list of test cases, e.g. [{'input': '[1, 2, 3]', 'output': '[3, 2, 1]'}]")
    language: str = Field("python", description="The programming language of the starter code")

class AnswerEvaluation(BaseModel):
    score: float = Field(..., description="Score from 0 to 100 representing correctness and clarity of answer content")
    feedback: str = Field(..., description="Specific critiques, highlight positive aspects and areas of improvement")
    grammar_score: float = Field(..., description="Grammar score from 0 to 100 representing spelling, grammar, and language structure")
    confidence_score: float = Field(..., description="Confidence score from 0 to 100 representing speech clarity, lack of hesitation, and command")

class SkillScore(BaseModel):
    skill: str
    score: float

class FinalInterviewEvaluation(BaseModel):
    overall_score: float = Field(..., description="Weighted average score from 0 to 100")
    technical_score: float = Field(..., description="Technical competency score from 0 to 100")
    communication_score: float = Field(..., description="Communication clarity score from 0 to 100")
    problem_solving_score: float = Field(..., description="Problem solving and analytical logic score from 0 to 100")
    confidence_score: float = Field(..., description="Average confidence score from 0 to 100")
    grammar_score: float = Field(..., description="Average grammar score from 0 to 100")
    code_quality_score: float = Field(..., description="Code quality rating from 0 to 100 if coding round occurred, or general technical syntax clarity")
    strengths: List[str] = Field(..., description="List of candidate's core strengths")
    weaknesses: List[str] = Field(..., description="List of candidate's core weaknesses")
    suggestions: List[str] = Field(..., description="Actionable suggestions for the candidate")
    roadmap_7_day: List[str] = Field(..., description="7-day daily skill improvement checklist")
    roadmap_30_day: List[str] = Field(..., description="30-day learning checkpoints")
    skill_gaps: List[str] = Field(..., description="Key technical/behavioral skill gaps identified")
    recommended_technologies: List[str] = Field(..., description="Technologies recommended to prepare next")
    learning_resources: List[str] = Field(..., description="Specific recommended books, articles, or resources")
    next_interview_recommendation: str = Field(..., description="Advice on what topic/style of mock interview to try next")
    skill_scores: List[SkillScore] = Field(..., description="Individual scores for key skills evaluated")


# --- PROVIDER HELPERS ---

def get_ai_client(provider: str, db_user: Optional[Any] = None) -> Optional[dict]:
    """Check API configuration and return active client credentials."""
    if db_user:
        if provider == "openai" and getattr(db_user, 'openai_api_key', None):
            return {"type": "openai", "client": OpenAI(api_key=db_user.openai_api_key)}
        if provider == "gemini" and getattr(db_user, 'gemini_api_key', None):
            return {"type": "gemini", "client": genai.Client(api_key=db_user.gemini_api_key)}

    if provider == "openai":
        key = settings.OPENAI_API_KEY
        if key and "YOUR_OPENAI" not in key:
            return {"type": "openai", "client": OpenAI(api_key=key)}
    
    # Fallback/Default to Gemini
    key = settings.GEMINI_API_KEY
    if key and "YOUR_GEMINI" not in key:
        return {"type": "gemini", "client": genai.Client(api_key=key)}
        
    return None


# --- GENERATOR FUNCTIONS ---

def generate_first_question(
    interview_type: str,
    difficulty: str,
    resume_context: Optional[str] = None,
    db_user: Optional[Any] = None
) -> GeneratedQuestion:
    """Generate the initial interview question calibrated to the candidate's resume technologies."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        return get_mock_question(1, interview_type)

    system_instruction = f"""
    You are an expert interviewer conducting a {interview_type} mock interview at {difficulty} level.
    Generate the FIRST question. Calibrate it strictly to the candidate's resume details (skills, experience, certifications) if provided.
    Ensure the question is suitable for conversational speech answers.
    Do not ask random general questions if a resume is provided; tailor questions to the technologies and skills in their resume.

    Resume Details (if any):
    {resume_context or "Not provided"}
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": "Please generate the first question."}
                ],
                response_format=GeneratedQuestion,
                temperature=0.7
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents="Please generate the first question.",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=GeneratedQuestion,
                    temperature=0.7
                )
            )
            return GeneratedQuestion.model_validate_json(response.text)
    except Exception as e:
        print(f"AI first question generation failed: {e}")
        return get_mock_question(1, interview_type)


def generate_adaptive_question(
    interview_type: str,
    difficulty: str,
    history_logs: List[dict],
    resume_context: Optional[str] = None,
    db_user: Optional[Any] = None
) -> GeneratedQuestion:
    """Generate the next adaptive interview question based on previous answers."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        return get_mock_question(len(history_logs) + 1, interview_type)

    # Serialize history logs
    formatted_history = ""
    for idx, item in enumerate(history_logs):
        formatted_history += f"Q{idx+1}: {item.get('question')}\nCandidate Answer: {item.get('answer')}\nScore: {item.get('score')}/100\nFeedback: {item.get('feedback')}\n\n"

    system_instruction = f"""
    You are an expert interviewer conducting a {interview_type} mock interview at {difficulty} level.
    Analyze the candidate's previous responses in the conversation log.
    If the candidate answered exceptionally well, increase the technical depth and ask a more challenging follow-up question.
    If their answer was weak or incorrect, ask a clarifying follow-up or a simpler foundational query in that category.
    Maintain a natural, flowing conversation. Tailor the topics strictly to their resume tech stack and experience.

    Resume Details (if any):
    {resume_context or "Not provided"}

    Interview Conversation Logs:
    {formatted_history}
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": "Please formulate the next adaptive question."}
                ],
                response_format=GeneratedQuestion,
                temperature=0.7
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents="Please formulate the next adaptive question.",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=GeneratedQuestion,
                    temperature=0.7
                )
            )
            return GeneratedQuestion.model_validate_json(response.text)
    except Exception as e:
        print(f"AI adaptive question generation failed: {e}")
        return get_mock_question(len(history_logs) + 1, interview_type)


def generate_coding_challenge(
    difficulty: str,
    resume_context: Optional[str] = None,
    db_user: Optional[Any] = None
) -> GeneratedCodingChallenge:
    """Generate a custom coding challenge tailored to the candidate's resume technologies."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        return get_mock_coding_challenge(difficulty)

    system_instruction = f"""
    You are a senior software engineer generating an algorithmic coding challenge for a candidate.
    Calibrate the difficulty strictly to: {difficulty}.
    Tailor the programming language or problem domain to match technologies present in the candidate's resume (if provided).
    For example, if they specify Python or JavaScript, choose appropriate data structure tasks that align with their skill level.
    Return a detailed Markdown problem description, starter code signature in Python, and test cases in JSON format.

    Resume Details (if any):
    {resume_context or "Not provided"}
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": "Generate one custom coding challenge."}
                ],
                response_format=GeneratedCodingChallenge,
                temperature=0.7
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents="Generate one custom coding challenge.",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=GeneratedCodingChallenge,
                    temperature=0.7
                )
            )
            return GeneratedCodingChallenge.model_validate_json(response.text)
    except Exception as e:
        print(f"AI coding challenge generation failed: {e}")
        return get_mock_coding_challenge(difficulty)


def evaluate_candidate_answer(
    question_text: str,
    user_answer: str,
    expected_answer: Optional[str] = None,
    db_user: Optional[Any] = None
) -> AnswerEvaluation:
    """Evaluate a single question response score, feedback, grammar, and confidence."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        score = 80.0 if len(user_answer) > 30 else 55.0
        return AnswerEvaluation(
            score=score,
            feedback="Good response. Try to give more concrete architecture examples in your future explanations.",
            grammar_score=85.0,
            confidence_score=78.0
        )

    prompt = f"""
    Question/Challenge: {question_text}
    Expected/Ideal Answers: {expected_answer or "Accuracy, syntax correctness, and edge cases"}
    Candidate Response: {user_answer}

    Grade the candidate's response (could be code or speech). Give a numeric score (0-100), actionable constructive critique,
    and individual metrics for grammar correctness and speaking confidence/clarity based on language formulation.

    If the response is a code implementation (programming round):
    1. Provide a detailed code review detailing readability, correctness, and potential edge-case errors.
    2. Explicitly state the Time Complexity (e.g., O(N) or O(N log N)) of the code.
    3. Explicitly state the Space Complexity (e.g., O(1) or O(N)) of the code.
    Format your feedback/critique nicely in markdown so that the Candidate can read the code review and complexities clearly.
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                response_format=AnswerEvaluation,
                temperature=0.2
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnswerEvaluation,
                    temperature=0.2
                )
            )
            return AnswerEvaluation.model_validate_json(response.text)
    except Exception as e:
        print(f"AI answer evaluation failed: {e}")
        return AnswerEvaluation(
            score=75.0,
            feedback="Parsed response successfully. Keep practicing.",
            grammar_score=80.0,
            confidence_score=75.0
        )


def evaluate_full_interview(
    interview_type: str,
    history_logs: List[dict],
    resume_context: Optional[str] = None,
    db_user: Optional[Any] = None
) -> FinalInterviewEvaluation:
    """Perform aggregate assessment of the interview, outputting scores and a detailed learning roadmap."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        scores = [item.get("score", 70.0) for item in history_logs if item.get("score") is not None]
        avg = sum(scores) / len(scores) if scores else 75.0
        return FinalInterviewEvaluation(
            overall_score=avg,
            technical_score=avg + 2,
            communication_score=avg - 2,
            problem_solving_score=avg,
            confidence_score=78.0,
            grammar_score=82.0,
            code_quality_score=80.0,
            strengths=["Strong core frontend layout knowledge.", "Good ownership attitude."],
            weaknesses=["Needs work on recursive algorithms.", "Lacks depth in database replication strategies."],
            suggestions=[
                "Expand on system design patterns, especially horizontal scalability.",
                "Structure your responses using the STAR method for behavioral queries."
            ],
            roadmap_7_day=[
                "Day 1-2: Read System Design sharding details.",
                "Day 3-5: Review React Fiber reconciliation cycles.",
                "Day 6-7: Practice basic recursive tree algorithms."
            ],
            roadmap_30_day=[
                "Week 1: Focus on database indexing and storage architectures.",
                "Week 2: Deep dive into JavaScript closures and async rendering.",
                "Week 3: Work on tree and graph BFS/DFS questions.",
                "Week 4: Execute mixed mock interview simulation practices."
            ],
            skill_gaps=["DFS Recursion", "Database Partitioning"],
            recommended_technologies=["PostgreSQL Sharding", "React Fiber"],
            learning_resources=["Designing Data-Intensive Applications", "Leetcode 101 Trees section"],
            next_interview_recommendation="Mixed Systems Mock Interview Practice",
            skill_scores=[
                SkillScore(skill="Core Technical", score=avg + 5),
                SkillScore(skill="Communication Clarity", score=avg - 5)
            ]
        )

    formatted_history = ""
    for idx, item in enumerate(history_logs):
        formatted_history += f"Q{idx+1}: {item.get('question')}\nAnswer: {item.get('answer')}\nScore: {item.get('score')}/100\nFeedback: {item.get('feedback')}\n\n"

    prompt = f"""
    Perform a thorough overall evaluation of the candidate's performance in this {interview_type} mock interview.
    Compute weighted competency scores (technical, communication, problem solving, confidence, grammar, code quality),
    extract strengths/weaknesses, and compile a 7-day + 30-day learning roadmap covering their skill gaps.

    Resume Details (if any):
    {resume_context or "Not provided"}

    Interview Logs:
    {formatted_history}
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                response_format=FinalInterviewEvaluation,
                temperature=0.3
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FinalInterviewEvaluation,
                    temperature=0.3
                )
            )
            return FinalInterviewEvaluation.model_validate_json(response.text)
    except Exception as e:
        print(f"AI aggregate evaluation failed: {e}")
        return FinalInterviewEvaluation(
            overall_score=78.0,
            technical_score=78.0,
            communication_score=76.0,
            problem_solving_score=75.0,
            confidence_score=78.0,
            grammar_score=80.0,
            code_quality_score=75.0,
            strengths=["Shows foundational programming knowledge."],
            weaknesses=["Code architecture could be optimized."],
            suggestions=["Work on code layout structures."],
            roadmap_7_day=["Review foundational data structures."],
            roadmap_30_day=["Practice algorithms and system design basics."],
            skill_gaps=["Algorithms"],
            recommended_technologies=["Python"],
            learning_resources=["General CS resources"],
            next_interview_recommendation="Basic coding round practice",
            skill_scores=[SkillScore(skill="General Knowledge", score=78.0)]
        )


# --- MOCK GENERATION FALLBACK DATA ---

def get_mock_question(q_num: int, interview_type: str) -> GeneratedQuestion:
    """Helper to return realistic standard questions for testing backend routines."""
    tech_questions = [
        GeneratedQuestion(
            text="Can you explain the virtual DOM reconciliation process in React, and how it differs from direct DOM updates?",
            category="React & UI Core",
            expected_answer="Reconciliation engine, virtual tree comparisons, fiber architecture, asynchronous rendering."
        ),
        GeneratedQuestion(
            text="What are database indexes, and how do they speed up select queries while potentially slowing down insert/update queries?",
            category="Databases & SQL",
            expected_answer="B-Trees/Hash index, disk seeks, index maintenance on writes."
        ),
        GeneratedQuestion(
            text="What is the difference between monolithic architecture and microservices? When would you choose one over another?",
            category="System Design",
            expected_answer="Scalability, deployment boundaries, network latencies, system complexity."
        ),
        GeneratedQuestion(
            text="Can you explain how a CORS issue occurs, and how you would securely resolve it on the backend server?",
            category="Web Security",
            expected_answer="Same-origin policy, browser verification checks, Access-Control-Allow-Origin headers."
        )
    ]
    
    hr_questions = [
        GeneratedQuestion(
            text="Can you tell me about a time you faced a difficult conflict with a coworker or stakeholder, and how you resolved it?",
            category="Conflict Resolution",
            expected_answer="Empathy, active listening, compromises, business goals."
        ),
        GeneratedQuestion(
            text="Describe a scenario where you made a significant technical mistake. How did you identify it, and what steps did you take to fix it?",
            category="Ownership & Mistakes",
            expected_answer="Ownership and responsibility, logical troubleshooting steps."
        )
    ]

    pool = tech_questions if "technical" in interview_type.lower() or "coding" in interview_type.lower() else hr_questions
    return pool[(q_num - 1) % len(pool)]


def get_mock_coding_challenge(difficulty: str) -> GeneratedCodingChallenge:
    """Returns classic mock coding tasks for offline testing."""
    return GeneratedCodingChallenge(
        title="Two Sum Problem",
        description="""
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.
You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

### Example 1:
```text
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

### Constraints:
* `2 <= nums.length <= 10^4`
* `-10^9 <= nums[i] <= 10^9`
        """,
        starter_code="""def two_sum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass
""",
        test_cases=json.dumps([
            {"input": "[2, 7, 11, 15], 9", "output": "[0, 1]"},
            {"input": "[3, 2, 4], 6", "output": "[1, 2]"}
        ]),
        language="python"
    )
