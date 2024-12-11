from keybert import KeyBERT

doc = """
Understanding of Object-oriented programming or Functional Programming paradigm.
Programming experience in at least one programming language e.g. Java, Python, etc.
Understanding of Data Structures and Problem Solving skills.
Passion for learning.
Basic Experience in working with SQL or NoSQL databases e.g. Postgress, MongoDB, Elasticsearch.
"""

kw_model = KeyBERT()
keywords = kw_model.extract_keywords(doc)
print(keywords)