from typing import List, Dict, Any

def evaluate_contract_risk(clauses: List[str], extracted_text: str) -> Dict[str, Any]:
    """
    Evaluates contract clauses and assigns an overall risk score and actionable risk items.
    """
    text_lower = (extracted_text + " " + " ".join(clauses)).lower()
    risks = []
    
    score = 0
    if "unlimited liability" in text_lower or "sole discretion" in text_lower:
        risks.append("Clause imposes unlimited liability or unilateral remedies.")
        score += 30
    if "indemnif" in text_lower and "broad" in text_lower:
        risks.append("Broad indemnity obligation without reciprocal protections.")
        score += 25
    if "auto-renew" in text_lower or "automatic renewal" in text_lower:
        risks.append("Automatic renewal clause requires tracking to prevent unintended contract extension.")
        score += 15
    if "penalty" in text_lower or "liquidated damages" in text_lower:
        risks.append("Contains explicit penalty provisions for operational delays.")
        score += 20
    if "audit" in text_lower and "unrestricted" in text_lower:
        risks.append("Unrestricted audit rights may compromise internal operational privacy.")
        score += 15
        
    if score >= 40:
        level = "High"
    elif score >= 20:
        level = "Moderate"
    else:
        level = "Low"
        if not risks:
            risks.append("No critical legal or financial risks detected.")
            
    return {
        "risk_level": level,
        "risk_score": score,
        "risk_indicators": risks
    }
