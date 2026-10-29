"""
Utilities for comparing numerical values in filter rules.
"""

def compare(val: float, comparison: str, threshold: float) -> bool:
    """
    Safely compare a numeric value against a threshold using standard operators.
    
    Supported comparisons:
    - 'eq': equal (within float tolerance)
    - 'neq': not equal
    - 'gt': strictly greater than
    - 'gte': greater than or equal to
    - 'lt': strictly less than
    - 'lte': less than or equal to
    """
    if comparison == 'eq':
        return abs(val - threshold) < 1e-9
    elif comparison == 'neq':
        return abs(val - threshold) >= 1e-9
    elif comparison == 'gt':
        return val > threshold
    elif comparison == 'gte':
        return val >= threshold
    elif comparison == 'lt':
        return val < threshold
    elif comparison == 'lte':
        return val <= threshold
    return False
