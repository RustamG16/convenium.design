# Roles — what each kind of person must show

`roles.json` is the machine version. This file explains it.

Eight roles for v1. A role answers three questions the composer needs: **what is the proof**
(which profile arrays carry the evidence), **which sections are required** (the page is wrong
without them), and **in what order the story is told**.

| Role | The proof | Required sections | Minimum viable |
|---|---|---|---|
| Engineer | projects, experience, skills | hero, proof grid, experience timeline, skills, contact | 2 projects or 1 experience |
| Designer | projects as case studies | hero, case studies, about, contact | 2 projects |
| Visual creative | work pieces | hero, gallery, about, contact | 4 work pieces |
| Writer / journalist | publications, writing pieces | hero, selected writing, about, contact | 3 publications or pieces |
| Founder / operator | ventures (experience + projects) | hero, ventures, about, contact | 1 venture |
| Consultant / coach | experience, testimonials | hero, offer, about, testimonials, contact | 1 experience |
| Researcher / academic | publications, research projects | hero, research, publications, contact | 1 publication or project |
| Student / early-career | projects, education | hero, projects, education, contact | 1 project |

Rules
- Below the minimum viable set, the composer produces the **card** variant: one screen, hero +
  about + contact + whatever proof exists. It never pads.
- Optional sections appear only when their data source (`sectionDataSources`) has ≥ 1 public
  entry.
- Secondary role: required sections from the primary, optional sections from both.
- Classification is rule-based first: populated arrays + skills keywords + `role.primary`
  from the file (the user's LLM already asked). The LLM breaks ties only when two roles score
  within 10% of each other. The user can override on the review screen.
- Hero variants per role are the DNA's choice set; the DNA picks one deterministically.
