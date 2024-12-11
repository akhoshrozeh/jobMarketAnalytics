import csv
from jobspy import scrape_jobs
import pandas as pd
import json
import spacy
from spacy.lang.en.stop_words import STOP_WORDS


def m_scrape():

    jobs = scrape_jobs(
        site_name=["indeed", "linkedin", "zip_recruiter", "glassdoor", "google"],
        search_term="software engineer",
        google_search_term="software engineer jobs near San Francisco, CA since yesterday",
        location="San Francisco, CA",
        results_wanted=20,
        hours_old=72,
        country_indeed='USA',
        
        # linkedin_fetch_description=True # gets more info such as description, direct job url (slower)
        # proxies=["208.195.175.46:65095", "208.195.175.45:65095", "localhost"],
    )
    print(f"Found {len(jobs)} jobs")
    print(jobs.head())
    jobs.to_csv("jobs.csv", quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False) # to_excel


def read_job_descriptions():
    df = pd.read_csv("jobs.csv")
    descriptions = df["description"].tolist()
    return descriptions




def preprocess_text(text, nlp):

    doc = nlp(text.lower())
    tokens = []
    for token in doc:
        if token.text not in STOP_WORDS and not token.is_punct and token.text != "\n":
            cleaned_token = token.lemma_.replace('\\', '').replace('\n', '')
            tokens.append(cleaned_token)
            # tokens.append(token.lemma_)

    # tokens = [token.lemma_ for token in doc if token.text not in STOP_WORDS and not token.is_punct and token.text != "\n"]
    return tokens



def main():
    nlp = spacy.load("en_core_web_sm")

    descriptions = read_job_descriptions()
    for i, x in enumerate(descriptions):
        if i >= 1:
            break

        print(x)

#         x = """Strong skills in HTML, CSS, JavaScript, and familiarity with frontend frameworks (e.g., React, Vue.js).
# Proven experience in frontend development
# Proficiency in design tools such as Figma, Sketch, or Adobe XD, with the ability to create detailed mockups and prototypes.
# Excellent understanding of user-centered design principles and best practices in usability.
# Strong problem-solving abilities and attention to detail.
# A natural go-getter with a proactive attitude, ready to tackle challenges and drive projects forward.
# Excellent communication skills, with the ability to articulate design concepts and collaborate effectively within a team in a fully remote environment."""

        tokens = preprocess_text(x, nlp)
        print(tokens)
        





    
    # with open("jobs_0.txt", "w", encoding="utf-8") as f:
    #     f.write(str(descriptions))

    # print(len(descriptions))




if __name__ == "__main__":
    main()

