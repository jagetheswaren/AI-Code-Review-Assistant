#!/usr/bin/env python3
"""
Sample complex Python file for testing Radon complexity analysis.
This file intentionally contains:
- Deeply nested loops
- Many if/elif conditions
- Exception handling
- Recursion
- Multiple branches
- High cyclomatic complexity functions
"""


def deeply_nested_loops(data):
    """Function with deeply nested loops - high cyclomatic complexity."""
    result = []
    for i in range(len(data)):
        for j in range(len(data[i])):
            for k in range(len(data[i][j])):
                for l in range(len(data[i][j][k])):
                    if data[i][j][k][l] > 0:
                        if data[i][j][k][l] % 2 == 0:
                            if data[i][j][k][l] > 10:
                                if data[i][j][k][l] < 100:
                                    result.append(data[i][j][k][l] * 2)
                                else:
                                    result.append(data[i][j][k][l] + 5)
                            else:
                                result.append(data[i][j][k][l] - 1)
                        else:
                            if data[i][j][k][l] > 5:
                                result.append(data[i][j][k][l] * 3)
                            else:
                                result.append(data[i][j][k][l] + 10)
                    else:
                        if data[i][j][k][l] < -10:
                            result.append(abs(data[i][j][k][l]))
                        elif data[i][j][k][l] == 0:
                            result.append(1)
                        else:
                            result.append(data[i][j][k][l] * -1)
    return result


def complex_conditional_chain(value, flag_a, flag_b, flag_c, flag_d, flag_e, mode):
    """Function with many if/elif conditions - high complexity."""
    result = 0
    
    if mode == "A":
        if flag_a:
            if value > 100:
                if flag_b:
                    result = value * 2
                elif flag_c:
                    result = value + 50
                else:
                    result = value - 10
            elif value > 50:
                if flag_d:
                    result = value * 3
                elif flag_e:
                    result = value / 2
                else:
                    result = value + 25
            else:
                if flag_a and flag_b:
                    result = value * 4
                elif flag_c or flag_d:
                    result = value + 100
                else:
                    result = value
    elif mode == "B":
        if flag_b:
            if value < 0:
                if flag_c:
                    result = abs(value) * 2
                elif flag_d:
                    result = abs(value) + 10
                else:
                    result = abs(value)
            elif value == 0:
                if flag_e:
                    result = 100
                else:
                    result = 0
            else:
                if flag_a:
                    result = value ** 2
                elif flag_c:
                    result = value ** 3
                else:
                    result = value
    elif mode == "C":
        if flag_c:
            if value % 2 == 0:
                if flag_d:
                    if flag_e:
                        result = value * 5
                    else:
                        result = value * 4
                else:
                    result = value * 3
            else:
                if flag_a:
                    result = value * 2
                elif flag_b:
                    result = value + 10
                else:
                    result = value
        elif flag_d:
            result = value * 6
        elif flag_e:
            result = value * 7
        else:
            result = value
    else:
        if flag_a or flag_b or flag_c or flag_d or flag_e:
            result = value * 10
        else:
            result = value
    
    return result


def recursive_factorial(n):
    """Recursive function with multiple branches."""
    if n < 0:
        raise ValueError("Negative input not allowed")
    if n == 0:
        return 1
    if n == 1:
        return 1
    if n > 100:
        return recursive_factorial(n - 1) * n
    if n > 50:
        try:
            return recursive_factorial(n - 1) * n
        except RecursionError:
            return -1
    if n > 20:
        return n * recursive_factorial(n - 1)
    return n * recursive_factorial(n - 1)


def exception_handling_maze(data, config):
    """Function with complex exception handling."""
    results = []
    
    for item in data:
        try:
            if config.get("validate", True):
                if not isinstance(item, dict):
                    raise TypeError("Item must be a dictionary")
                
                if "value" not in item:
                    raise KeyError("Missing 'value' key")
                
                value = item["value"]
                
                if config.get("check_range", True):
                    if value < config.get("min_val", 0):
                        raise ValueError(f"Value {value} below minimum")
                    if value > config.get("max_val", 100):
                        raise ValueError(f"Value {value} above maximum")
                
                if config.get("check_type", True):
                    if not isinstance(value, (int, float)):
                        raise TypeError("Value must be numeric")
                
                try:
                    processed = process_value(value, config)
                    results.append(processed)
                except ProcessingError as e:
                    if config.get("skip_errors", False):
                        continue
                    else:
                        raise
                        
        except TypeError as e:
            if config.get("log_errors", True):
                print(f"Type error: {e}")
            if not config.get("skip_errors", False):
                raise
        except KeyError as e:
            if config.get("log_errors", True):
                print(f"Key error: {e}")
            if not config.get("skip_errors", False):
                raise
        except ValueError as e:
            if config.get("log_errors", True):
                print(f"Value error: {e}")
            if not config.get("skip_errors", False):
                raise
        except ProcessingError as e:
            if config.get("log_errors", True):
                print(f"Processing error: {e}")
            if not config.get("skip_errors", False):
                raise
        except Exception as e:
            if config.get("log_errors", True):
                print(f"Unexpected error: {e}")
            raise
    
    return results


class ProcessingError(Exception):
    """Custom exception for processing errors."""
    pass


def process_value(value, config):
    """Helper function with multiple branches."""
    if config.get("operation") == "square":
        return value ** 2
    elif config.get("operation") == "cube":
        return value ** 3
    elif config.get("operation") == "sqrt":
        if value < 0:
            raise ProcessingError("Cannot sqrt negative number")
        return value ** 0.5
    elif config.get("operation") == "double":
        return value * 2
    elif config.get("operation") == "triple":
        return value * 3
    elif config.get("operation") == "increment":
        return value + 1
    elif config.get("operation") == "decrement":
        return value - 1
    elif config.get("operation") == "negate":
        return -value
    elif config.get("operation") == "absolute":
        return abs(value)
    else:
        return value


def massive_switch_like_function(action, params):
    """Function simulating a massive switch statement."""
    if action == "create":
        if params.get("type") == "user":
            return create_user(params)
        elif params.get("type") == "post":
            return create_post(params)
        elif params.get("type") == "comment":
            return create_comment(params)
        elif params.get("type") == "category":
            return create_category(params)
        elif params.get("type") == "tag":
            return create_tag(params)
        else:
            raise ValueError(f"Unknown create type: {params.get('type')}")
    elif action == "read":
        if params.get("type") == "user":
            return read_user(params)
        elif params.get("type") == "post":
            return read_post(params)
        elif params.get("type") == "comment":
            return read_comment(params)
        elif params.get("type") == "category":
            return read_category(params)
        elif params.get("type") == "tag":
            return read_tag(params)
        else:
            raise ValueError(f"Unknown read type: {params.get('type')}")
    elif action == "update":
        if params.get("type") == "user":
            return update_user(params)
        elif params.get("type") == "post":
            return update_post(params)
        elif params.get("type") == "comment":
            return update_comment(params)
        elif params.get("type") == "category":
            return update_category(params)
        elif params.get("type") == "tag":
            return update_tag(params)
        else:
            raise ValueError(f"Unknown update type: {params.get('type')}")
    elif action == "delete":
        if params.get("type") == "user":
            return delete_user(params)
        elif params.get("type") == "post":
            return delete_post(params)
        elif params.get("type") == "comment":
            return delete_comment(params)
        elif params.get("type") == "category":
            return delete_category(params)
        elif params.get("type") == "tag":
            return delete_tag(params)
        else:
            raise ValueError(f"Unknown delete type: {params.get('type')}")
    elif action == "list":
        if params.get("type") == "user":
            return list_users(params)
        elif params.get("type") == "post":
            return list_posts(params)
        elif params.get("type") == "comment":
            return list_comments(params)
        elif params.get("type") == "category":
            return list_categories(params)
        elif params.get("type") == "tag":
            return list_tags(params)
        else:
            raise ValueError(f"Unknown list type: {params.get('type')}")
    else:
        raise ValueError(f"Unknown action: {action}")


def create_user(params): return {"created": "user"}
def create_post(params): return {"created": "post"}
def create_comment(params): return {"created": "comment"}
def create_category(params): return {"created": "category"}
def create_tag(params): return {"created": "tag"}
def read_user(params): return {"read": "user"}
def read_post(params): return {"read": "post"}
def read_comment(params): return {"read": "comment"}
def read_category(params): return {"read": "category"}
def read_tag(params): return {"read": "tag"}
def update_user(params): return {"updated": "user"}
def update_post(params): return {"updated": "post"}
def update_comment(params): return {"updated": "comment"}
def update_category(params): return {"updated": "category"}
def update_tag(params): return {"updated": "tag"}
def delete_user(params): return {"deleted": "user"}
def delete_post(params): return {"deleted": "post"}
def delete_comment(params): return {"deleted": "comment"}
def delete_category(params): return {"deleted": "category"}
def delete_tag(params): return {"deleted": "tag"}
def list_users(params): return {"listed": "users"}
def list_posts(params): return {"listed": "posts"}
def list_comments(params): return {"listed": "comments"}
def list_categories(params): return {"listed": "categories"}
def list_tags(params): return {"listed": "tags"}


def combinatorial_explosion(a, b, c, d, e, f, g, h):
    """Function with many parameters and complex logic."""
    result = 0
    
    if a > 0:
        if b > 0:
            if c > 0:
                result += a + b + c
            else:
                result += a + b - c
        else:
            if d > 0:
                result += a - b + d
            else:
                result += a - b - d
    else:
        if e > 0:
            if f > 0:
                result += -a + e + f
            else:
                result += -a + e - f
        else:
            if g > 0:
                result += -a - e + g
            else:
                result += -a - e - g
    
    if h > 10:
        if result > 0:
            result *= 2
        else:
            result *= -2
    elif h > 5:
        if result > 0:
            result += 10
        else:
            result -= 10
    else:
        if result > 0:
            result = result
        else:
            result = -result
    
    return result


class ComplexClass:
    """Class with complex methods."""
    
    def __init__(self, config):
        self.config = config
        self.data = []
        self.cache = {}
    
    def process_batch(self, items):
        """Complex batch processing method."""
        results = []
        for item in items:
            try:
                processed = self._process_single(item)
                results.append(processed)
            except Exception as e:
                if self.config.get("fail_fast", False):
                    raise
                self._log_error(item, e)
        return results
    
    def _process_single(self, item):
        """Process a single item with many branches."""
        if item is None:
            raise ValueError("Item cannot be None")
        
        if isinstance(item, str):
            return self._process_string(item)
        elif isinstance(item, int):
            return self._process_int(item)
        elif isinstance(item, float):
            return self._process_float(item)
        elif isinstance(item, list):
            return self._process_list(item)
        elif isinstance(item, dict):
            return self._process_dict(item)
        elif isinstance(item, tuple):
            return self._process_tuple(item)
        else:
            raise TypeError(f"Unsupported type: {type(item)}")
    
    def _process_string(self, s):
        if len(s) > 100:
            return s[:100]
        if len(s) > 50:
            return s.upper()
        if len(s) > 10:
            return s.lower()
        return s
    
    def _process_int(self, n):
        if n > 1000:
            return n // 2
        if n > 100:
            return n * 2
        if n > 10:
            return n + 10
        if n > 0:
            return n * 10
        if n == 0:
            return 1
        return abs(n)
    
    def _process_float(self, f):
        if f > 100.0:
            return f / 2
        if f > 10.0:
            return f * 2
        if f > 1.0:
            return f + 1
        if f > 0.0:
            return f * 10
        if f == 0.0:
            return 1.0
        return abs(f)
    
    def _process_list(self, lst):
        if len(lst) > 100:
            return lst[:100]
        if len(lst) > 50:
            return lst[::2]
        if len(lst) > 10:
            return lst[::-1]
        return lst
    
    def _process_dict(self, d):
        if len(d) > 20:
            return dict(list(d.items())[:20])
        if len(d) > 10:
            return {k: v for k, v in d.items() if v}
        return d
    
    def _process_tuple(self, t):
        return list(t)
    
    def _log_error(self, item, error):
        """Log error with multiple conditions."""
        if self.config.get("log_level") == "debug":
            print(f"DEBUG: Error processing {item}: {error}")
        elif self.config.get("log_level") == "info":
            print(f"INFO: Error processing item: {error}")
        elif self.config.get("log_level") == "warning":
            print(f"WARNING: Error: {error}")
        else:
            pass
        
        if self.config.get("store_errors", False):
            if "errors" not in self.cache:
                self.cache["errors"] = []
            self.cache["errors"].append({"item": item, "error": str(error)})


def main():
    """Main function to demonstrate usage."""
    test_data = [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]
    result = deeply_nested_loops(test_data)
    print(f"Nested loops result: {result[:10]}...")
    
    result = complex_conditional_chain(75, True, False, True, False, True, "A")
    print(f"Conditional chain result: {result}")
    
    result = recursive_factorial(10)
    print(f"Factorial result: {result}")
    
    config = {"validate": True, "check_range": True, "skip_errors": True}
    test_data = [{"value": 50}, {"value": 150}, {"value": -10}, {"invalid": "data"}]
    result = exception_handling_maze(test_data, config)
    print(f"Exception handling result: {result}")
    
    result = massive_switch_like_function("create", {"type": "user", "name": "test"})
    print(f"Switch result: {result}")
    
    result = combinatorial_explosion(1, 2, 3, 4, 5, 6, 7, 15)
    print(f"Combinatorial result: {result}")
    
    processor = ComplexClass({"fail_fast": False, "log_level": "info"})
    result = processor.process_batch(["hello", 42, 3.14, [1,2,3], {"a": 1}, (1,2)])
    print(f"Batch result: {result}")


if __name__ == "__main__":
    main()