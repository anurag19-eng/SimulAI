from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import database as db
from interviewers.finance import prompt as f_prompt
from interviewers.it_interview import prompt as it_prompt
from interviewers.management import prompt as m_prompt
from interviewers.marketing import prompt as ma_prompt

load_dotenv()

client=genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

prompts={
    "finance":f_prompt,
    "it":it_prompt,
    "marketing":m_prompt,
    "management":ma_prompt
}

def get_prompt(interviwer_id):
    return prompts.get(interviwer_id)


def update_memory_ai(username,interviewer_id):

    full_history=db.full_history(username,interviewer_id)

    if len(full_history)<=14:
        return

    profile_mem, current_summary=db.memory_context(username,interviewer_id)

    formated_history="\n".join([f"{role}:{content}" for role,content in full_history])

    summary_prompt=f"""
    You are an AI interview memory extraction engine for SimulAi, an AI Virtual Interview Simulator.

    Analyze the previous interview information provided below and update the candidate's persistent career profile and interview history.

    Your task is to maintain useful information that can help SimulAi conduct better interviews with this candidate in the future.

    TASK 1 — UPDATE INTERVIEW SUMMARY:
    Create an updated summary of the candidate's previous interview experience.
    Keep it strictly under 3 sentences.
    Focus on the topics discussed, questions answered, overall performance, and important areas that were demonstrated or discussed.

    TASK 2 — UPDATE CANDIDATE PROFILE:
    Extract important and reasonably stable career-related information about the candidate.

    Include information such as:
    - Education and academic background
    - Technical or professional skills
    - Programming languages and technologies
    - Projects and practical experience
    - Internships or work experience
    - Certifications
    - Areas of professional interest
    - Strengths demonstrated during interviews
    - Recurring weaknesses or areas that need improvement
    - Important career goals when explicitly mentioned
    - Knowledge gaps discovered during previous interviews

    Do NOT store:
    - Temporary emotions or moods
    - Casual conversation
    - Unrelated personal information
    - Assumptions that were not supported by the interview
    - Information that is only relevant to a single question unless it indicates a meaningful skill or weakness

    If new information contradicts an older profile fact, update the older information rather than keeping both versions.

    [Current Interview Summary]:
    {current_summary}

    [Current Candidate Profile]:
    {profile_mem}

    [Previous Interview Information]:
    {formated_history}

    Output your analysis EXACTLY in this format:

    SUMMARY: <updated interview summary>

    PROFILE: <updated candidate profile>
    """
    try:
        summ_res=client.models.generate_content(
            model="gemini-2.5-flash",
            contents=summary_prompt,
            config=types.GenerateContentConfig(temperature=0.0)
        )
        sum_text=summ_res.text

        new_summ=sum_text.split("SUMMARY:")[1].split("PROFILE:")[0].strip()
        new_prof=sum_text.split("PROFILE:")[1].strip()

        db.update_memory(username,interviewer_id,new_summ,new_prof)
    except Exception as e:
        print(f"\nSystem memory didnt updated{e}")


def get_interviewer_res(username,interviewer_id):

    cv=db.get_resume(username)

    profile_mem,conversation_summary=db.memory_context(username,interviewer_id)
    recent_logs=db.recent_ai_context(username,interviewer_id,limit=12)

    context=f"""
    [CANDIDATE CV]
    {cv}
    [INTERVIEW SUMMARY]
    {conversation_summary}
    [CANDIDATE SUMMARY]
    {profile_mem}"""

    candidate_con=[]

    if conversation_summary or profile_mem:
        candidate_con.append(
            types.Content(
                role="model",
                parts=[types.Part.from_text(text=context)]
            )
        )

    for role,content in recent_logs:
        sdk_role="user" if role=="user" else "model"

        candidate_con.append(
            types.Content(
                role=sdk_role,
                parts=[types.Part.from_text(text=content)]
            )
        )

    response=client.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=candidate_con,
        config=types.GenerateContentConfig(
            system_instruction=get_prompt(interviewer_id),
            temperature=0.75
        )
    )
    for chunks in response:
        if chunks.text:
            yield chunks.text