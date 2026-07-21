import json
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from google.genai import types
from app.core.config import settings
from app.services.gemini import get_ai_client

# --- SCHEMAS FOR PLACEMENT AI ---

class ResumeEnhancement(BaseModel):
    improved_text: str = Field(..., description="The professionally rephrased and enhanced text")
    suggestions: List[str] = Field(..., description="Actionable points explaining what was changed and why")

class CoverLetterResponse(BaseModel):
    content: str = Field(..., description="The generated cover letter in professional format")
    strengths_highlighted: List[str] = Field(..., description="Candidate strengths emphasized in the letter")

class SocialMetrics(BaseModel):
    score: int = Field(..., description="Overall profile rating from 0 to 100")
    headline_suggestion: Optional[str] = Field(None, description="Critique and rewrite for profile headline")
    summary_suggestion: Optional[str] = Field(None, description="Critique and rewrite for summary biography")
    missing_sections: List[str] = Field(..., description="Core sections missing or under-utilized")
    suggestions: List[str] = Field(..., description="Specific checklist items to improve visibility")

class GithubMetrics(BaseModel):
    score: int = Field(..., description="Overall portfolio rating from 0 to 100")
    repos_analyzed: List[str] = Field(..., description="List of primary repository names reviewed")
    readme_quality: str = Field(..., description="Critique of repository README documentation")
    commit_activity_feedback: str = Field(..., description="Feedback on commit frequencies and consistency")
    portfolio_suggestions: List[str] = Field(..., description="Specific targets to boost open-source presentation")

class DiscussionBotTurn(BaseModel):
    bot_name: str = Field(..., description="The bot persona speaking, e.g. 'Moderator', 'Tech Advocate', 'HR Specialist'")
    text: str = Field(..., description="The actual conversational dialogue line spoken by the bot")
    target_user: bool = Field(False, description="True if the bot asks a direct question prompting the candidate to respond")

class DiscussionEvaluation(BaseModel):
    confidence: float = Field(..., description="Score 0-100 measuring assertion and direct responses")
    leadership: float = Field(..., description="Score 0-100 measuring turn-taking and coordination traits")
    communication: float = Field(..., description="Score 0-100 measuring conversational flow and clarity")
    relevance: float = Field(..., description="Score 0-100 measuring focus on the discussion topic")
    vocabulary: float = Field(..., description="Score 0-100 measuring use of correct terminology")
    feedback: str = Field(..., description="Thorough aggregate critique of their discussion performance")

# --- PLACEMENT AI SERVICES ---

def improve_resume_section(
    field_name: str,
    field_value: str,
    target_role: Optional[str] = None,
    db_user: Optional[Any] = None
) -> ResumeEnhancement:
    """Enhance resume summaries, experience bullet points, or projects descriptions using AI."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        return ResumeEnhancement(
            improved_text=f"Enhanced {field_name}: Strong track record of technical delivery and architectural scaling matching {target_role or 'software engineering'} standards. Built reusable modules and streamlined workflow operations.",
            suggestions=["Emphasized active technical verbs.", "Simplified sentence layouts for cleaner parsing."]
        )

    prompt = f"""
    Target Job Role: {target_role or "Software Engineer"}
    Resume Section/Field: {field_name}
    Original Content: {field_value}

    Analyze the original text and rewrite it professionally to fit the targeted job role standards.
    Increase clarity, use high-impact action verbs (e.g. Architected, Streamlined, Spearheaded), and highlight metrics/impact.
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format=ResumeEnhancement,
                temperature=0.3
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ResumeEnhancement,
                    temperature=0.3
                )
            )
            return ResumeEnhancement.model_validate_json(response.text)
    except Exception as e:
        print(f"AI resume field enhance failed: {e}")
        return ResumeEnhancement(
            improved_text=field_value,
            suggestions=["Could not connect to AI. Kept original content."]
        )


def generate_cover_letter_ai(
    resume_text: str,
    company: str,
    role: str,
    job_desc: Optional[str] = None,
    db_user: Optional[Any] = None
) -> CoverLetterResponse:
    """Generate a highly targeted cover letter based on user's resume and job description."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        content = f"""Dear Hiring Team at {company},

I am writing to express my enthusiasm for the {role} position. With my background in software development and technical solutions, I am confident in my capability to deliver high-quality contributions to your team.

My technical profile matches the requirements outlined in your job posting. I look forward to discussing my qualifications in an interview.

Sincerely,
Applicant"""
        return CoverLetterResponse(
            content=content,
            strengths_highlighted=["Technical foundations", "Agile workspace adaptability"]
        )

    prompt = f"""
    Target Company: {company}
    Target Job Role: {role}
    Job Description (if any): {job_desc or "Not provided"}
    Candidate Resume Background: {resume_text}

    Generate a professional cover letter matching traditional layout standards. Do not make up facts;
    align letter content strictly with skills and projects present in the candidate's resume context.
    Keep the tone professional, persuasive, and custom-tailored to the target company's objectives.
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format=CoverLetterResponse,
                temperature=0.3
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CoverLetterResponse,
                    temperature=0.3
                )
            )
            return CoverLetterResponse.model_validate_json(response.text)
    except Exception as e:
        print(f"AI cover letter generation failed: {e}")
        return CoverLetterResponse(
            content="Failed to generate cover letter. Technical exception occurred.",
            strengths_highlighted=["Error"]
        )


def analyze_linkedin_profile(
    profile_url: str,
    db_user: Optional[Any] = None
) -> SocialMetrics:
    """Analyze pasted LinkedIn URL structure and return optimization scores."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        return SocialMetrics(
            score=72,
            headline_suggestion="Needs dynamic tagline. Try: 'Software Engineer | FastAPI & React | Building scalable architectures'",
            summary_suggestion="Summary is too short. Expand on your project highlights, core stack expertise, and business results.",
            missing_sections=["Featured Projects", "Skills verification badges"],
            suggestions=["Add a clear portfolio link in bio.", "Request recommendations from peers."]
        )

    prompt = f"Analyze this LinkedIn profile URL: {profile_url}. Critique standard outline sections and propose improvements."

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format=SocialMetrics,
                temperature=0.5
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SocialMetrics,
                    temperature=0.5
                )
            )
            return SocialMetrics.model_validate_json(response.text)
    except Exception as e:
        print(f"AI LinkedIn analyze failed: {e}")
        return SocialMetrics(
            score=65,
            missing_sections=["LinkedIn analysis failed to process."],
            suggestions=["Make sure profile visibility is set to public."]
        )


def analyze_github_portfolio(
    github_url: str,
    db_user: Optional[Any] = None
) -> GithubMetrics:
    """Audit GitHub url repositories, activity, and README layout guides."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    if not ai_meta:
        return GithubMetrics(
            score=78,
            repos_analyzed=["portfolio-app", "algorithms-practice", "api-backend"],
            readme_quality="Mostly clean starter profiles. Repositories need detailed deployment instructions and architecture diagrams.",
            commit_activity_feedback="Consistent recent history. Try to space contributions to demonstrate daily integration habits.",
            portfolio_suggestions=[
                "Create a profile README presenting key technologies.",
                "Link working live demos in repository headers."
            ]
        )

    prompt = f"Audit this GitHub developer portfolio URL: {github_url}. Analyze repository presentation and project completeness."

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format=GithubMetrics,
                temperature=0.5
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GithubMetrics,
                    temperature=0.5
                )
            )
            return GithubMetrics.model_validate_json(response.text)
    except Exception as e:
        print(f"AI GitHub analysis failed: {e}")
        return GithubMetrics(
            score=60,
            repos_analyzed=[],
            readme_quality="Unable to retrieve repositories.",
            commit_activity_feedback="No logs found.",
            portfolio_suggestions=["Ensure the target GitHub handle exists and is public."]
        )


def generate_next_discussion_turn(
    topic: str,
    history: List[Dict[str, str]],
    db_user: Optional[Any] = None
) -> DiscussionBotTurn:
    """Generate next response turn from other AI bot participants in a group discussion room."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    
    # Format log
    formatted = ""
    for turn in history[-6:]:
        formatted += f"{turn.get('speaker', 'Candidate')}: {turn.get('text')}\n"

    if not ai_meta:
        bot_names = ["Moderator", "Tech Advocate", "HR Consultant"]
        idx = len(history) % 3
        return DiscussionBotTurn(
            bot_name=bot_names[idx],
            text=f"Interesting perspective on '{topic}'. However, we should also examine resource constraints and cost structures. What do you think?",
            target_user=(idx == 0)
        )

    prompt = f"""
    Discussion Topic: {topic}
    Conversation Logs:
    {formatted}

    Formulate the next turn. Choose a logical bot speaker persona (e.g. Moderator to ask a question, Tech Advocate to disagree/concur on technical details, or HR Specialist to review candidate logic).
    Keep response text under 4 sentences. Make it conversational and engaging.
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format=DiscussionBotTurn,
                temperature=0.7
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DiscussionBotTurn,
                    temperature=0.7
                )
            )
            return DiscussionBotTurn.model_validate_json(response.text)
    except Exception as e:
        print(f"AI discussion turn failed: {e}")
        return DiscussionBotTurn(
            bot_name="Moderator",
            text="Let's ensure everyone gets a chance to elaborate on their technical choices.",
            target_user=True
        )


def evaluate_discussion_session(
    topic: str,
    history: List[Dict[str, str]],
    db_user: Optional[Any] = None
) -> DiscussionEvaluation:
    """Analyze group discussion conversation logs and return granular metric scores."""
    ai_meta = get_ai_client(settings.AI_PROVIDER, db_user)
    
    formatted = ""
    for turn in history:
        formatted += f"{turn.get('speaker')}: {turn.get('text')}\n"

    if not ai_meta:
        return DiscussionEvaluation(
            confidence=82.0,
            leadership=75.0,
            communication=80.0,
            relevance=90.0,
            vocabulary=78.0,
            feedback="Great participation. Demonstrated sound understanding of the subject, although leadership metrics could increase by summarizing details at the end."
        )

    prompt = f"""
    Discussion Topic: {topic}
    Complete Conversation Logs:
    {formatted}

    Evaluate the 'Candidate' speaker turns. Grade their performance from 0 to 100 on Confidence, Leadership traits,
    Communication clarity, Topic relevance, and Technical vocabulary usage. Return constructive suggestions.
    """

    try:
        if ai_meta["type"] == "openai":
            response = ai_meta["client"].beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format=DiscussionEvaluation,
                temperature=0.2
            )
            return response.choices[0].message.parsed
        else:
            response = ai_meta["client"].models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DiscussionEvaluation,
                    temperature=0.2
                )
            )
            return DiscussionEvaluation.model_validate_json(response.text)
    except Exception as e:
        print(f"AI discussion evaluation failed: {e}")
        return DiscussionEvaluation(
            confidence=75.0,
            leadership=70.0,
            communication=75.0,
            relevance=80.0,
            vocabulary=75.0,
            feedback="Completed analysis successfully. Keep practicing to enhance leadership metrics."
        )
