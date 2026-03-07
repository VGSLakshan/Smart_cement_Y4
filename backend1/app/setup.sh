#!/usr/bin/env python3
"""
Setup Verification Script for SMART_CEMENT Backend
File: backend/check_setup.py

Usage: python check_setup.py
"""
import sys
from pathlib import Path
import importlib.util

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BLUE}{BOLD}{text:^60}{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}\n")

def print_check(name, passed, details=""):
    symbol = f"{GREEN}✓{RESET}" if passed else f"{RED}✗{RESET}"
    status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    print(f"  {symbol} {name:<40} [{status}]")
    if details:
        print(f"     {YELLOW}{details}{RESET}")

def check_python_version():
    """Check if Python version is 3.9+"""
    version = sys.version_info
    required = (3, 9)
    passed = version >= required
    details = f"Found Python {version.major}.{version.minor}.{version.micro}"
    return passed, details

def check_directory_structure():
    """Check if required directories exist"""
    base_dir = Path(__file__).parent
    required_dirs = [
        base_dir / "app",
        base_dir / "app" / "models",
        base_dir / "app" / "routes",
        base_dir / "app" / "services",
        base_dir / "app" / "services" / "chamudini",
        base_dir / "app" / "utils",
        base_dir / "ml_models",
        base_dir / "ml_models" / "chamudini",
    ]
    
    missing = [d.name for d in required_dirs if not d.exists()]
    passed = len(missing) == 0
    details = f"Missing: {', '.join(missing)}" if missing else "All directories present"
    return passed, details

def check_required_files():
    """Check if required files exist"""
    base_dir = Path(__file__).parent
    required_files = [
        base_dir / "app" / "main.py",
        base_dir / "app" / "config.py",
        base_dir / "app" / "routes" / "chamudini.py",
        base_dir / "app" / "services" / "chamudini" / "model_service.py",
        base_dir / "app" / "services" / "chamudini" / "image_processor.py",
        base_dir / "app" / "utils" / "file_handler.py",
        base_dir / "requirements.txt",
    ]
    
    missing = [f.name for f in required_files if not f.exists()]
    passed = len(missing) == 0
    details = f"Missing: {', '.join(missing)}" if missing else "All files present"
    return passed, details

def check_model_file():
    """Check if model file exists"""
    base_dir = Path(__file__).parent
    model_path = base_dir / "ml_models" / "chamudini" / "final_model.keras"
    passed = model_path.exists()
    
    if passed:
        size_mb = model_path.stat().st_size / (1024 * 1024)
        details = f"Found ({size_mb:.2f} MB)"
    else:
        details = "Copy model to ml_models/chamudini/final_model.keras"
    
    return passed, details

def check_dependencies():
    """Check if key dependencies are installed"""
    required_packages = {
        'fastapi': 'fastapi',
        'uvicorn': 'uvicorn',
        'tensorflow': 'tensorflow',
        'PIL': 'pillow',
        'numpy': 'numpy',
        'pydantic': 'pydantic',
    }
    
    missing = []
    for module_name, package_name in required_packages.items():
        if importlib.util.find_spec(module_name) is None:
            missing.append(package_name)
    
    passed = len(missing) == 0
    details = f"Missing: {', '.join(missing)}" if missing else "All packages installed"
    return passed, details

def check_env_file():
    """Check if .env file exists"""
    base_dir = Path(__file__).parent
    env_path = base_dir / ".env"
    example_path = base_dir / ".env.example"
    
    if env_path.exists():
        passed = True
        details = ".env file found"
    elif example_path.exists():
        passed = False
        details = "Copy .env.example to .env (or use defaults)"
    else:
        passed = False
        details = ".env.example not found"
    
    return passed, details

def check_config_import():
    """Check if config can be imported"""
    try:
        from app.config import settings
        passed = True
        details = f"APP_NAME: {settings.APP_NAME}"
    except Exception as e:
        passed = False
        details = f"Error: {str(e)[:50]}"
    
    return passed, details

def check_class_names():
    """Check if class_names.json exists"""
    base_dir = Path(__file__).parent
    class_names_path = base_dir / "ml_models" / "chamudini" / "class_names.json"
    passed = class_names_path.exists()
    
    if passed:
        import json
        with open(class_names_path) as f:
            classes = json.load(f)
        details = f"Classes: {', '.join(classes)}"
    else:
        details = "Will use defaults: C2S, C3A, C3S, C4AF"
    
    return passed, details

def main():
    print(f"\n{BOLD}SMART_CEMENT Backend Setup Verification{RESET}")
    
    checks = [
        ("Python Version (3.9+)", check_python_version),
        ("Directory Structure", check_directory_structure),
        ("Required Files", check_required_files),
        ("Model File", check_model_file),
        ("Class Names JSON", check_class_names),
        ("Environment File", check_env_file),
        ("Dependencies Installed", check_dependencies),
        ("Config Import", check_config_import),
    ]
    
    results = []
    
    print_header("Running Setup Checks")
    
    for name, check_func in checks:
        try:
            passed, details = check_func()
            print_check(name, passed, details)
            results.append(passed)
        except Exception as e:
            print_check(name, False, f"Error: {str(e)}")
            results.append(False)
    
    # Summary
    passed_count = sum(results)
    total_count = len(results)
    
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}Results: {passed_count}/{total_count} checks passed{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}\n")
    
    if all(results):
        print(f"{GREEN}{BOLD}✓ All checks passed! Your backend is ready to run.{RESET}\n")
        print("Start the server with:")
        print(f"  {BLUE}uvicorn app.main:app --reload{RESET}\n")
        print("Then visit:")
        print(f"  {BLUE}http://localhost:8000/api/docs{RESET}\n")
    else:
        print(f"{RED}{BOLD}✗ Some checks failed. Please fix the issues above.{RESET}\n")
        
        if not results[3]:  # Model file check
            print(f"{YELLOW}Most important: Copy your trained model file!{RESET}")
            print(f"  cp /path/to/final_model.keras ml_models/chamudini/\n")
        
        if not results[6]:  # Dependencies check
            print(f"{YELLOW}Install dependencies:{RESET}")
            print(f"  pip install -r requirements.txt\n")
        
        print("Run this script again after fixing issues:")
        print(f"  {BLUE}python check_setup.py{RESET}\n")
    
    return 0 if all(results) else 1

if __name__ == "__main__":
    sys.exit(main())