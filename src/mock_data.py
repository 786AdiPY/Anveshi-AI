"""
Anveshi AI — Pre-populated Mock Research Runs
Provides rich representation data for research runs, evidence graphs, agent inspection, and reports.
"""
from typing import Dict, Any

MOCK_RESEARCH_RUNS: Dict[str, Dict[str, Any]] = {
    "9e5a624c-e5bd-47c7-b271-8e04282b42cc": {
        "id": "9e5a624c-e5bd-47c7-b271-8e04282b42cc",
        "question": "What are the trade-offs of RAG vs fine-tuning for enterprise LLMs?",
        "depth": "standard",
        "status": "completed",
        "created_at": "2026-08-17T07:21:10.000000+00:00",
        "started_at": "2026-08-17T07:21:11.000000+00:00",
        "completed_at": "2026-08-17T07:22:45.000000+00:00",
        "error": None,
        "events": [
            {
                "timestamp": "2026-08-17T07:21:12.000Z",
                "agent": "planner_agent",
                "step_count": 1,
                "papers_count": 0,
                "claims_count": 0,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T07:21:25.000Z",
                "agent": "literature_agent",
                "step_count": 2,
                "papers_count": 4,
                "claims_count": 0,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T07:21:45.000Z",
                "agent": "extractor_agent",
                "step_count": 3,
                "papers_count": 4,
                "claims_count": 4,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T07:22:10.000Z",
                "agent": "verifier_agent",
                "step_count": 4,
                "papers_count": 4,
                "claims_count": 4,
                "verified_count": 4,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T07:22:45.000Z",
                "agent": "synthesizer_agent",
                "step_count": 5,
                "papers_count": 4,
                "claims_count": 4,
                "verified_count": 4,
                "contradictions_count": 0,
                "status": "completed",
                "error": None,
            },
        ],
        "latest_state": {
            "papers": [
                {
                    "id": "paper_1",
                    "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
                    "authors": ["Patrick Lewis", "Ethan Perez", "Aleksandra Piktus", "Fabio Petroni"],
                    "year": 2020,
                    "url": "https://arxiv.org/abs/2005.11401",
                    "doi": "10.48550/arXiv.2005.11401",
                    "abstract": "We explore Retrieval-Augmented Generation (RAG) models which combine pre-trained parametric and non-parametric memory for language generation. RAG models generate responses conditioned on retrieved documents.",
                    "venue": "NeurIPS 2020",
                    "source_type": "academic_paper",
                },
                {
                    "id": "paper_2",
                    "title": "LoRA: Low-Rank Adaptation of Large Language Models",
                    "authors": ["Edward J. Hu", "Yernar Wallis", "Zeyuan Allen-Zhu", "Yuanzhi Li"],
                    "year": 2021,
                    "url": "https://arxiv.org/abs/2106.09685",
                    "doi": "10.48550/arXiv.2106.09685",
                    "abstract": "Low-Rank Adaptation (LoRA) freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, reducing trainable parameters by 10,000x.",
                    "venue": "ICLR 2022",
                    "source_type": "academic_paper",
                },
                {
                    "id": "paper_3",
                    "title": "Benchmarking RAG vs. Fine-Tuning in Specialized Enterprise Domains",
                    "authors": ["Chen Xu", "Rui Zhang", "Hao Wang"],
                    "year": 2024,
                    "url": "https://arxiv.org/abs/2401.08402",
                    "doi": None,
                    "abstract": "Comparative evaluation demonstrating that RAG excels at dynamic knowledge insertion and factual citation accuracy, whereas LoRA fine-tuning provides superior style alignment and domain-specific terminology fluency.",
                    "venue": "ACL 2024",
                    "source_type": "academic_paper",
                },
                {
                    "id": "paper_4",
                    "title": "Cost Efficiency & Latency Analysis of Enterprise Hybrid LLM Deployments",
                    "authors": ["David Miller", "Elena Rostova"],
                    "year": 2023,
                    "url": "https://arxiv.org/abs/2311.10901",
                    "doi": None,
                    "abstract": "An empirical assessment of infrastructure cost trade-offs between continuous vector database indexing for RAG vs periodic parameter updates via PEFT fine-tuning.",
                    "venue": "IEEE Software Engineering",
                    "source_type": "academic_paper",
                },
            ],
            "claims": [
                {
                    "id": "claim_1",
                    "statement": "RAG reduces hallucinations by grounding responses in retrieved vector documents, providing verifiable citations.",
                    "paper_id": "paper_1",
                    "subquestion": "How does RAG compare to fine-tuning for factual accuracy?",
                    "confidence_score": 0.94,
                    "supporting_evidence": ["ev_1"],
                    "verification_status": "PASS",
                },
                {
                    "id": "claim_2",
                    "statement": "LoRA fine-tuning reduces parameter memory footprint by up to 10,000x compared to full model fine-tuning.",
                    "paper_id": "paper_2",
                    "subquestion": "What are the computational requirements for fine-tuning?",
                    "confidence_score": 0.98,
                    "supporting_evidence": ["ev_2"],
                    "verification_status": "PASS",
                },
                {
                    "id": "claim_3",
                    "statement": "Hybrid architecture combining RAG retrieval with domain-adapted LoRA fine-tuning yields the highest overall accuracy.",
                    "paper_id": "paper_3",
                    "subquestion": "Can RAG and fine-tuning be combined effectively?",
                    "confidence_score": 0.91,
                    "supporting_evidence": ["ev_3"],
                    "verification_status": "PASS",
                },
                {
                    "id": "claim_4",
                    "statement": "RAG infrastructure scales linearly with document corpus size, whereas fine-tuning incurs upfront compute overhead per retraining cycle.",
                    "paper_id": "paper_4",
                    "subquestion": "What are the long-term operational costs?",
                    "confidence_score": 0.88,
                    "supporting_evidence": ["ev_4"],
                    "verification_status": "PASS",
                },
            ],
            "evidence": [
                {
                    "id": "ev_1",
                    "paper_id": "paper_1",
                    "excerpt": "RAG models demonstrate a 43% relative reduction in hallucinations compared to parametric-only BART models on TriviaQA and Jeopardy benchmarks.",
                    "methodology": "Empirical QA Benchmark evaluation across 5 open-domain datasets.",
                    "findings": "Non-parametric memory lookup significantly increases factual grounding.",
                    "relevance_score": 0.95,
                },
                {
                    "id": "ev_2",
                    "paper_id": "paper_2",
                    "excerpt": "LoRA reduces GPU memory consumption during training from 1.2TB to 350GB for GPT-3 175B while matching full fine-tuning performance within 0.5% accuracy.",
                    "methodology": "Low-rank matrix decomposition applied to Attention weights (Wq, Wv).",
                    "findings": "LoRA achieves comparable task performance with 3x GPU memory savings.",
                    "relevance_score": 0.97,
                },
                {
                    "id": "ev_3",
                    "paper_id": "paper_3",
                    "excerpt": "Combining LoRA domain adapters with dense vector retrieval improved legal document summary compliance from 78.4% to 94.2%.",
                    "methodology": "Multi-stage pipeline test on 1,500 enterprise legal contracts.",
                    "findings": "Synergistic gains achieved when style is fine-tuned and facts are retrieved dynamically.",
                    "relevance_score": 0.92,
                },
                {
                    "id": "ev_4",
                    "paper_id": "paper_4",
                    "excerpt": "Vector DB indexing cost for 1M documents was $140/mo compared to $2,400 per retraining job for 70B parameter models.",
                    "methodology": "Cost accounting on AWS EC2 & Pinecone vector storage over 12 months.",
                    "findings": "RAG provides superior ROI for dynamic corpora updated more frequently than weekly.",
                    "relevance_score": 0.89,
                },
            ],
            "contradictions": [],
            "verification_results": [
                {
                    "id": "vr_1",
                    "claim_id": "claim_1",
                    "status": "PASS",
                    "checks": [
                        {"name": "Source Citation Check", "passed": True, "note": "Verified against NeurIPS 2020 primary paper"},
                        {"name": "Factual Grounding Check", "passed": True, "note": "Grounding metric > 0.90"},
                    ],
                    "reasons": ["Direct citation provided in paper_1 with matching empirical evidence."],
                    "missing_evidence": [],
                },
                {
                    "id": "vr_2",
                    "claim_id": "claim_2",
                    "status": "PASS",
                    "checks": [
                        {"name": "Parameter Math Check", "passed": True, "note": "Validated 10,000x rank reduction equation"},
                    ],
                    "reasons": ["LoRA paper formulas confirm matrix rank breakdown."],
                    "missing_evidence": [],
                },
                {
                    "id": "vr_3",
                    "claim_id": "claim_3",
                    "status": "PASS",
                    "checks": [
                        {"name": "Empirical Accuracy Check", "passed": True, "note": "Legal contract benchmark verified"},
                    ],
                    "reasons": ["ACL 2024 benchmark data supports hybrid architecture advantages."],
                    "missing_evidence": [],
                },
                {
                    "id": "vr_4",
                    "claim_id": "claim_4",
                    "status": "PASS",
                    "checks": [
                        {"name": "Cost Model Check", "passed": True, "note": "AWS/Pinecone pricing verified"},
                    ],
                    "reasons": ["Cost per document update verified against standard cloud metrics."],
                    "missing_evidence": [],
                },
            ],
            "research_brief": """# Executive Brief: RAG vs. Fine-Tuning for Enterprise LLMs

## Overview
When deploying Large Language Models (LLMs) in enterprise environments, engineering teams face a fundamental architecture choice between **Retrieval-Augmented Generation (RAG)** and **Parameter-Efficient Fine-Tuning (PEFT/LoRA)**.

---

## Key Trade-offs Summary

| Criterion | Retrieval-Augmented Generation (RAG) | Fine-Tuning (LoRA / PEFT) |
| :--- | :--- | :--- |
| **Knowledge Freshness** | Real-time dynamic updates | Static snapshot (requires retraining) |
| **Factual Verifiability** | High (exact source links & citations) | Low (parametric memory hallucination risk) |
| **Domain Style Adaptation** | Moderate | High (learns specific syntax & voice) |
| **Upfront Compute Cost** | Low (embedding generation only) | High (GPU cluster compute per run) |
| **Inference Latency** | Higher (+150-300ms vector lookup) | Lower (native model forward pass) |

---

## Recommendation & Architecture Pattern
For dynamic datasets that update daily (e.g., customer support, legal docs, codebase search), **RAG is strongly recommended**. For static domains requiring rigid formatting output (e.g., medical diagnostics, SQL query generation), **LoRA fine-tuning** is ideal. 

The industry standard for high-stakes enterprise applications is a **Hybrid Approach**: using LoRA to adapt output formatting while enforcing strict RAG retrieval for factual knowledge verification.
""",
            "evidence_graph_data": {
                "nodes": [
                    {"id": "claim_1", "type": "claim", "data": {"label": "RAG reduces hallucinations by 43%", "status": "PASS", "confidence": 0.94}},
                    {"id": "claim_2", "type": "claim", "data": {"label": "LoRA reduces parameters by 10,000x", "status": "PASS", "confidence": 0.98}},
                    {"id": "claim_3", "type": "claim", "data": {"label": "Hybrid RAG + LoRA yields highest accuracy", "status": "PASS", "confidence": 0.91}},
                    {"id": "paper_1", "type": "paper", "data": {"label": "Lewis et al. (2020) NeurIPS", "title": "Retrieval-Augmented Generation"}},
                    {"id": "paper_2", "type": "paper", "data": {"label": "Hu et al. (2021) ICLR", "title": "LoRA: Low-Rank Adaptation"}},
                    {"id": "paper_3", "type": "paper", "data": {"label": "Xu et al. (2024) ACL", "title": "Benchmarking RAG vs Fine-Tuning"}},
                ],
                "edges": [
                    {"id": "e1", "source": "paper_1", "target": "claim_1", "label": "SUPPORTS"},
                    {"id": "e2", "source": "paper_2", "target": "claim_2", "label": "SUPPORTS"},
                    {"id": "e3", "source": "paper_3", "target": "claim_3", "label": "SUPPORTS"},
                    {"id": "e4", "source": "claim_1", "target": "claim_3", "label": "EXTENDS"},
                ],
            },
        },
    },
    "114221d7-951f-47dc-8288-752c67dfd948": {
        "id": "114221d7-951f-47dc-8288-752c67dfd948",
        "question": "Does intermittent fasting improve metabolic health markers?",
        "depth": "deep",
        "status": "completed",
        "created_at": "2026-08-17T05:48:21.000000+00:00",
        "started_at": "2026-08-17T05:48:22.000000+00:00",
        "completed_at": "2026-08-17T05:50:15.000000+00:00",
        "error": None,
        "events": [
            {
                "timestamp": "2026-08-17T05:48:22.000Z",
                "agent": "planner_agent",
                "step_count": 1,
                "papers_count": 0,
                "claims_count": 0,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:48:40.000Z",
                "agent": "literature_agent",
                "step_count": 2,
                "papers_count": 3,
                "claims_count": 0,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:49:10.000Z",
                "agent": "extractor_agent",
                "step_count": 3,
                "papers_count": 3,
                "claims_count": 3,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:49:45.000Z",
                "agent": "verifier_agent",
                "step_count": 4,
                "papers_count": 3,
                "claims_count": 3,
                "verified_count": 3,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:50:15.000Z",
                "agent": "synthesizer_agent",
                "step_count": 5,
                "papers_count": 3,
                "claims_count": 3,
                "verified_count": 3,
                "contradictions_count": 0,
                "status": "completed",
                "error": None,
            },
        ],
        "latest_state": {
            "papers": [
                {
                    "id": "paper_if_1",
                    "title": "Effects of Intermittent Fasting on Health, Aging, and Disease",
                    "authors": ["Rafael de Cabo", "Mark P. Mattson"],
                    "year": 2019,
                    "url": "https://www.nejm.org/doi/full/10.1056/NEJMra1905136",
                    "doi": "10.1056/NEJMra1905136",
                    "abstract": "Review of metabolic switching from glucose to ketone bodies, demonstrating improvements in insulin resistance, blood pressure, and inflammation markers.",
                    "venue": "New England Journal of Medicine",
                    "source_type": "journal_review",
                },
                {
                    "id": "paper_if_2",
                    "title": "Time-Restricted Eating in Type 2 Diabetes: Randomized Controlled Trial",
                    "authors": ["Vidyani Suryanarayana", "Sathish Kumar"],
                    "year": 2022,
                    "url": "https://www.cell.com/cell-metabolism/fulltext/S1550-4131(22)00402-4",
                    "doi": None,
                    "abstract": "10-hour time-restricted eating intervention significantly lowered HbA1c levels and reduced body weight in patients with type 2 diabetes over 12 weeks.",
                    "venue": "Cell Metabolism",
                    "source_type": "clinical_trial",
                },
                {
                    "id": "paper_if_3",
                    "title": "Caloric Restriction vs Time-Restricted Feeding for Weight Loss",
                    "authors": ["Ethan Weiss", "Krista Varady"],
                    "year": 2021,
                    "url": "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2771095",
                    "doi": "10.1001/jamainternmed.2020.4153",
                    "abstract": "Comparison demonstrating similar overall weight loss between 8-hour time-restricted feeding and continuous caloric restriction when overall calories are equated.",
                    "venue": "JAMA Internal Medicine",
                    "source_type": "clinical_trial",
                },
            ],
            "claims": [
                {
                    "id": "claim_if_1",
                    "statement": "Intermittent fasting triggers a metabolic switch from glucose to ketone utilization, improving insulin sensitivity.",
                    "paper_id": "paper_if_1",
                    "subquestion": "What biological mechanisms mediate fasting benefits?",
                    "confidence_score": 0.96,
                    "supporting_evidence": ["ev_if_1"],
                    "verification_status": "PASS",
                },
                {
                    "id": "claim_if_2",
                    "statement": "10-hour time-restricted eating reduces HbA1c levels significantly in Type 2 Diabetes patients.",
                    "paper_id": "paper_if_2",
                    "subquestion": "Does intermittent fasting improve blood glucose control?",
                    "confidence_score": 0.93,
                    "supporting_evidence": ["ev_if_2"],
                    "verification_status": "PASS",
                },
                {
                    "id": "claim_if_3",
                    "statement": "Weight loss magnitude is primarily driven by net caloric reduction rather than fasting duration alone.",
                    "paper_id": "paper_if_3",
                    "subquestion": "Is intermittent fasting superior to continuous caloric restriction?",
                    "confidence_score": 0.89,
                    "supporting_evidence": ["ev_if_3"],
                    "verification_status": "PASS",
                },
            ],
            "evidence": [
                {
                    "id": "ev_if_1",
                    "paper_id": "paper_if_1",
                    "excerpt": "Metabolic switching occurs at 12 to 36 hours of food deprivation, causing blood ketone levels (beta-hydroxybutyrate) to rise from 0.1mM to 2-5mM.",
                    "methodology": "Biochemical biomarker profiling across human clinical trial cohorts.",
                    "findings": "Ketosis shifts cellular metabolism toward bioenergetic stress resistance.",
                    "relevance_score": 0.96,
                },
                {
                    "id": "ev_if_2",
                    "paper_id": "paper_if_2",
                    "excerpt": "HbA1c decreased by 0.52% in the 10-hour TRE group compared to 0.11% in standard care controls over 12 weeks (p < 0.001).",
                    "methodology": "Randomized 1:1 intervention trial with 154 participants.",
                    "findings": "Clinically meaningful reduction in glycemic biomarkers.",
                    "relevance_score": 0.94,
                },
                {
                    "id": "ev_if_3",
                    "paper_id": "paper_if_3",
                    "excerpt": "Weight loss was -0.94kg in the 16:8 TRE group vs -0.68kg in the control group, showing no statistically significant difference when total daily calories were matched.",
                    "methodology": "12-week randomized clinical trial with 116 adults.",
                    "findings": "Isocaloric restriction yields equivalent weight loss regardless of window.",
                    "relevance_score": 0.90,
                },
            ],
            "contradictions": [],
            "verification_results": [
                {
                    "id": "vr_if_1",
                    "claim_id": "claim_if_1",
                    "status": "PASS",
                    "checks": [{"name": "Biomarker Verification", "passed": True}],
                    "reasons": ["NEJM trial data confirms beta-hydroxybutyrate elevation."],
                    "missing_evidence": [],
                },
                {
                    "id": "vr_if_2",
                    "claim_id": "claim_if_2",
                    "status": "PASS",
                    "checks": [{"name": "Clinical Trial Significance", "passed": True}],
                    "reasons": ["Cell Metabolism RCT confirms p < 0.001 HbA1c reduction."],
                    "missing_evidence": [],
                },
                {
                    "id": "vr_if_3",
                    "claim_id": "claim_if_3",
                    "status": "PASS",
                    "checks": [{"name": "Isocaloric Control Check", "passed": True}],
                    "reasons": ["JAMA trial data confirms equivalent weight loss under matched caloric intake."],
                    "missing_evidence": [],
                },
            ],
            "research_brief": """# Clinical Evidence Synthesis: Intermittent Fasting & Metabolic Markers

## Executive Summary
A comprehensive meta-analysis of clinical trial literature reveals strong empirical support for **Intermittent Fasting (IF)** and **Time-Restricted Eating (TRE)** in improving key metabolic markers—including **insulin sensitivity, fasting blood glucose, and systemic inflammation**.

---

## Summary of Findings

1. **Metabolic Switching & Ketosis**: Fasting windows exceeding 12–16 hours initiate a metabolic transition from glycogen breakdown to fatty acid oxidation and ketone production.
2. **Glycemic Control (HbA1c)**: 10-hour TRE interventions consistently produce a **~0.5% reduction in HbA1c** in individuals with Type 2 Diabetes.
3. **Weight Loss Mechanism**: When daily caloric intake is strictly controlled, time-restricted eating provides comparable weight loss to standard caloric restriction, indicating that fasting benefits stem from both caloric intake control and circadian alignment.
""",
            "evidence_graph_data": {
                "nodes": [
                    {"id": "claim_if_1", "type": "claim", "data": {"label": "Metabolic switch to ketone utilization", "status": "PASS", "confidence": 0.96}},
                    {"id": "claim_if_2", "type": "claim", "data": {"label": "10h TRE reduces HbA1c by ~0.5%", "status": "PASS", "confidence": 0.93}},
                    {"id": "claim_if_3", "type": "claim", "data": {"label": "Weight loss driven by net caloric reduction", "status": "PASS", "confidence": 0.89}},
                    {"id": "paper_if_1", "type": "paper", "data": {"label": "de Cabo & Mattson (2019) NEJM", "title": "Effects of Intermittent Fasting"}},
                    {"id": "paper_if_2", "type": "paper", "data": {"label": "Suryanarayana et al. (2022) Cell Met", "title": "Time-Restricted Eating in T2D"}},
                    {"id": "paper_if_3", "type": "paper", "data": {"label": "Weiss et al. (2021) JAMA Int Med", "title": "Caloric Restriction vs TRE"}},
                ],
                "edges": [
                    {"id": "e_if1", "source": "paper_if_1", "target": "claim_if_1", "label": "SUPPORTS"},
                    {"id": "e_if2", "source": "paper_if_2", "target": "claim_if_2", "label": "SUPPORTS"},
                    {"id": "e_if3", "source": "paper_if_3", "target": "claim_if_3", "label": "SUPPORTS"},
                ],
            },
        },
    },
    "c207c947-2e74-49a1-ae52-4f73631dbd37": {
        "id": "c207c947-2e74-49a1-ae52-4f73631dbd37",
        "question": "Are quantum computing algorithms superior for supply chain optimization?",
        "depth": "standard",
        "status": "completed",
        "created_at": "2026-08-17T05:32:16.000000+00:00",
        "started_at": "2026-08-17T05:32:17.000000+00:00",
        "completed_at": "2026-08-17T05:33:50.000000+00:00",
        "error": None,
        "events": [
            {
                "timestamp": "2026-08-17T05:32:17.000Z",
                "agent": "planner_agent",
                "step_count": 1,
                "papers_count": 0,
                "claims_count": 0,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:32:35.000Z",
                "agent": "literature_agent",
                "step_count": 2,
                "papers_count": 3,
                "claims_count": 0,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:33:00.000Z",
                "agent": "extractor_agent",
                "step_count": 3,
                "papers_count": 3,
                "claims_count": 3,
                "verified_count": 0,
                "contradictions_count": 0,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:33:25.000Z",
                "agent": "verifier_agent",
                "step_count": 4,
                "papers_count": 3,
                "claims_count": 3,
                "verified_count": 2,
                "contradictions_count": 1,
                "status": "running",
                "error": None,
            },
            {
                "timestamp": "2026-08-17T05:33:50.000Z",
                "agent": "synthesizer_agent",
                "step_count": 5,
                "papers_count": 3,
                "claims_count": 3,
                "verified_count": 2,
                "contradictions_count": 1,
                "status": "completed",
                "error": None,
            },
        ],
        "latest_state": {
            "papers": [
                {
                    "id": "paper_qc_1",
                    "title": "Quantum Approximate Optimization Algorithm for Hard Combinatorial Supply Chains",
                    "authors": ["Edward Farhi", "Jeffrey Goldstone", "Sam Gutmann"],
                    "year": 2022,
                    "url": "https://arxiv.org/abs/1411.4028",
                    "doi": None,
                    "abstract": "We evaluate QAOA algorithms on NP-hard Traveling Salesperson (TSP) and Vehicle Routing Problems (VRP), analyzing quantum speedup boundaries on NISQ hardware.",
                    "venue": "Quantum Information Processing",
                    "source_type": "academic_paper",
                },
                {
                    "id": "paper_qc_2",
                    "title": "Benchmark of Classical Solvers vs QAOA on 50-Node Vehicle Routing",
                    "authors": ["Satoru Tanaka", "Yoshihiro Natsume"],
                    "year": 2023,
                    "url": "https://arxiv.org/abs/2305.12001",
                    "doi": None,
                    "abstract": "Classical Gurobi and OR-Tools solvers outperform current NISQ quantum annealers on 50-node routing problems due to qubit decoherence and gate noise.",
                    "venue": "IEEE Transactions on Quantum Engineering",
                    "source_type": "academic_paper",
                },
            ],
            "claims": [
                {
                    "id": "claim_qc_1",
                    "statement": "QAOA algorithm theoretically scales polynomially faster than classical brute-force enumeration for NP-hard routing problems.",
                    "paper_id": "paper_qc_1",
                    "subquestion": "What is the theoretical quantum speedup?",
                    "confidence_score": 0.92,
                    "supporting_evidence": ["ev_qc_1"],
                    "verification_status": "PASS",
                },
                {
                    "id": "claim_qc_2",
                    "statement": "Current classical solvers (Gurobi/CPLEX) consistently outperform NISQ quantum annealers for real-world supply chain problems up to 500 nodes.",
                    "paper_id": "paper_qc_2",
                    "subquestion": "Do current quantum hardware solvers outperform classical tools?",
                    "confidence_score": 0.97,
                    "supporting_evidence": ["ev_qc_2"],
                    "verification_status": "PASS",
                },
            ],
            "evidence": [
                {
                    "id": "ev_qc_1",
                    "paper_id": "paper_qc_1",
                    "excerpt": "QAOA with p=8 layers achieves a ground-state approximation ratio > 0.91 for max-cut representations of vehicle routing.",
                    "methodology": "Quantum circuit simulation on IBM Q assembly.",
                    "findings": "Theoretical quadratic speedup bound verified in noiseless simulation.",
                    "relevance_score": 0.91,
                },
                {
                    "id": "ev_qc_2",
                    "paper_id": "paper_qc_2",
                    "excerpt": "Gurobi solved 50-node VRP in 0.42 seconds, whereas D-Wave Advantage required 12.8 seconds and exhibited 4.1% sub-optimal route length due to thermal noise.",
                    "methodology": "Empirical benchmarking on D-Wave 5000+ qubit processor vs Gurobi 10.0.",
                    "findings": "Classical heuristic algorithms remain superior on NISQ-era hardware.",
                    "relevance_score": 0.98,
                },
            ],
            "contradictions": [
                {
                    "id": "cnt_qc_1",
                    "claim_id": "claim_qc_1",
                    "opposing_paper_id": "paper_qc_2",
                    "opposing_evidence_id": "ev_qc_2",
                    "explanation": "Theoretical quadratic speedup of QAOA does not translate to real-world NISQ hardware advantage due to gate fidelity and connectivity limitations.",
                    "severity": "moderate",
                }
            ],
            "verification_results": [
                {
                    "id": "vr_qc_1",
                    "claim_id": "claim_qc_1",
                    "status": "PASS",
                    "checks": [{"name": "Theoretical Proof Check", "passed": True}],
                    "reasons": ["Math proof in Farhi et al. confirmed."],
                    "missing_evidence": [],
                },
                {
                    "id": "vr_qc_2",
                    "claim_id": "claim_qc_2",
                    "status": "PASS",
                    "checks": [{"name": "Hardware Benchmark Check", "passed": True}],
                    "reasons": ["IEEE TQE benchmark dataset confirms classical superiority on current hardware."],
                    "missing_evidence": [],
                },
            ],
            "research_brief": """# Technical Assessment: Quantum Computing vs. Classical Solvers in Supply Chain

## Executive Summary
While **Quantum Approximate Optimization Algorithms (QAOA)** offer theoretical polynomial speedups for NP-hard combinatorial optimization, **current NISQ-era quantum hardware does not yet outperform modern classical MILP solvers** (such as Gurobi or CPLEX) for practical enterprise supply chain scale (>50 nodes).

---

## Key Findings

1. **Theoretical Advantage**: Simulated noiseless QAOA circuits achieve high approximation ratios (>0.91) for vehicle routing problem formulations.
2. **Hardware Bottleneck**: Quantum decoherence and limited qubit connectivity on current annealers (D-Wave Advantage, IBM Eagle) result in higher latency and lower route efficiency than GPU-accelerated classical heuristics.
3. **Timeline Projection**: Practical quantum advantage for supply chain logistics is projected for fault-tolerant quantum hardware expected post-2028.
""",
            "evidence_graph_data": {
                "nodes": [
                    {"id": "claim_qc_1", "type": "claim", "data": {"label": "Theoretical QAOA speedup for routing", "status": "PASS", "confidence": 0.92}},
                    {"id": "claim_qc_2", "type": "claim", "data": {"label": "Classical Gurobi outperforms NISQ hardware", "status": "PASS", "confidence": 0.97}},
                    {"id": "paper_qc_1", "type": "paper", "data": {"label": "Farhi et al. (2022)", "title": "QAOA for Combinatorial Supply Chains"}},
                    {"id": "paper_qc_2", "type": "paper", "data": {"label": "Tanaka et al. (2023) IEEE", "title": "Benchmark of Classical Solvers vs QAOA"}},
                ],
                "edges": [
                    {"id": "e_qc1", "source": "paper_qc_1", "target": "claim_qc_1", "label": "SUPPORTS"},
                    {"id": "e_qc2", "source": "paper_qc_2", "target": "claim_qc_2", "label": "SUPPORTS"},
                    {"id": "e_qc3", "source": "claim_qc_2", "target": "claim_qc_1", "label": "CONTRADICTS"},
                ],
            },
        },
    },
}
