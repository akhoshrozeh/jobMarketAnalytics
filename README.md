# Real-Time Job Market Analytics

## What is it?
A project that aims to provide users insightful data about trends, both past and current, in the job market (specifically Tech, at the moment).

## Who is it for?
Those who want get stay ahead of the curve. The goal is to allow people to see what skills are on the rise, which are fading out, and what remains in-demand. 

## How does it work?
We pull thousands of different job postings every day from the big boards (more to be added). We extract the key skills that the employer is looking for and organize them by time. 

### Reproducing the AWS Infrastructure Notes:
- Make sure you're zipped package opens up as a folder named "python", with all dependencies inside. If it isn't named "python", the lambda runtime won't find your package. Your .zip canbe named anything. 
- Delete `tests` dir from big packages (e.g. pandas). Will help keep under 250MB package deployment limit.
test
