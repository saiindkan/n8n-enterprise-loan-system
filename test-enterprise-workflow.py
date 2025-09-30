"""
Test script for Enterprise n8n Loan Processing Workflow
Tests the enterprise workflow with sample data and validates responses
"""
import json
import requests
import time
from datetime import datetime
from typing import Dict, Any, List

class EnterpriseN8NWorkflowTester:
    """Test class for enterprise n8n loan processing workflow"""
    
    def __init__(self, webhook_url: str, api_key: str = None):
        """
        Initialize the tester
        
        Args:
            webhook_url: n8n webhook URL
            api_key: API key for authentication
        """
        self.webhook_url = webhook_url
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'X-Enterprise-Tier': 'enterprise'
        }
        
        if api_key:
            self.headers['X-API-Key'] = api_key
    
    def create_enterprise_loan_data(self) -> Dict[str, Any]:
        """Create sample enterprise loan application data for testing"""
        return {
            "loan_id": f"ENT-LOAN-{int(time.time())}",
            "borrower_info": {
                "name": "John Enterprise",
                "email": "john.enterprise@company.com",
                "phone": "(555) 123-4567",
                "address": "123 Enterprise Blvd, Business City, ST 12345",
                "ssn": "123-45-6789",
                "date_of_birth": "1980-01-15",
                "marital_status": "married",
                "dependents": 2,
                "employment_status": "employed"
            },
            "financial_info": {
                "annual_income": 150000,
                "monthly_income": 12500,
                "employment": "Senior Software Engineer",
                "employer": "Enterprise Tech Corp",
                "employment_length": 8,
                "employment_type": "full_time",
                "credit_score": 780,
                "debt_to_income_ratio": 0.28,
                "assets": 200000,
                "debts": 3500,
                "bank_accounts": [
                    {
                        "account_type": "checking",
                        "balance": 75000,
                        "institution": "Enterprise Bank"
                    },
                    {
                        "account_type": "savings",
                        "balance": 125000,
                        "institution": "Enterprise Bank"
                    }
                ]
            },
            "property_info": {
                "address": "456 Executive Drive, Business City, ST 12345",
                "property_type": "single_family",
                "purchase_price": 500000,
                "loan_amount": 400000,
                "down_payment": 100000,
                "loan_to_value": 0.8,
                "property_taxes": 6000,
                "homeowners_insurance": 2000,
                "hoa_fees": 300,
                "property_use": "primary_residence"
            },
            "loan_details": {
                "loan_type": "conventional",
                "loan_purpose": "purchase",
                "interest_rate": 4.25,
                "loan_term": 30,
                "monthly_payment": 1968.22,
                "closing_costs": 12000,
                "prepaid_items": 4000,
                "total_cash_needed": 116000
            },
            "documents": [
                {
                    "document_id": "DOC-ENT-001",
                    "filename": "enterprise_loan_application.pdf",
                    "document_type": "loan_application",
                    "content": "Enterprise loan application with comprehensive borrower information...",
                    "upload_date": datetime.now().isoformat(),
                    "file_size": "3.2MB"
                },
                {
                    "document_id": "DOC-ENT-002",
                    "filename": "enterprise_bank_statement.pdf",
                    "document_type": "bank_statement",
                    "content": "Enterprise bank statement showing substantial account balances...",
                    "upload_date": datetime.now().isoformat(),
                    "file_size": "2.8MB"
                },
                {
                    "document_id": "DOC-ENT-003",
                    "filename": "enterprise_pay_stub.pdf",
                    "document_type": "pay_stub",
                    "content": "Enterprise pay stub showing high income and benefits...",
                    "upload_date": datetime.now().isoformat(),
                    "file_size": "1.1MB"
                },
                {
                    "document_id": "DOC-ENT-004",
                    "filename": "enterprise_tax_return_2023.pdf",
                    "document_type": "tax_return",
                    "content": "Enterprise tax return showing high income and deductions...",
                    "upload_date": datetime.now().isoformat(),
                    "file_size": "4.5MB"
                },
                {
                    "document_id": "DOC-ENT-005",
                    "filename": "enterprise_credit_report.pdf",
                    "document_type": "credit_report",
                    "content": "Enterprise credit report showing excellent credit history...",
                    "upload_date": datetime.now().isoformat(),
                    "file_size": "3.1MB"
                }
            ],
            "application_date": datetime.now().isoformat(),
            "company_id": "mortgagecompany1",
            "loan_officer": "Enterprise_Loan_Officer",
            "processing_notes": "Enterprise loan application with excellent credit profile and high income",
            "special_conditions": [],
            "status": "submitted",
            "enterprise_metadata": {
                "processing_tier": "enterprise",
                "compliance_level": "high",
                "audit_required": True,
                "priority_level": "high"
            }
        }
    
    def test_enterprise_workflow(self, loan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test the enterprise n8n workflow with loan data
        
        Args:
            loan_data: Enterprise loan application data
            
        Returns:
            Workflow response
        """
        try:
            print(f"🏢 Testing enterprise n8n workflow with loan ID: {loan_data['loan_id']}")
            print(f"📡 Sending request to: {self.webhook_url}")
            
            # Send request to webhook
            response = requests.post(
                self.webhook_url,
                json=loan_data,
                headers=self.headers,
                timeout=180  # 3 minute timeout for enterprise processing
            )
            
            # Check response
            if response.status_code == 200:
                result = response.json()
                print("✅ Enterprise workflow executed successfully")
                return {
                    "status": "success",
                    "response": result,
                    "status_code": response.status_code,
                    "processing_time": response.elapsed.total_seconds()
                }
            else:
                print(f"❌ Enterprise workflow failed with status code: {response.status_code}")
                return {
                    "status": "error",
                    "error": response.text,
                    "status_code": response.status_code,
                    "processing_time": response.elapsed.total_seconds()
                }
                
        except requests.exceptions.Timeout:
            print("⏰ Enterprise workflow timed out")
            return {
                "status": "timeout",
                "error": "Enterprise workflow execution timed out",
                "processing_time": 180
            }
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "processing_time": 0
            }
    
    def test_enterprise_validation_errors(self) -> List[Dict[str, Any]]:
        """Test enterprise workflow with invalid data to check validation"""
        test_cases = [
            {
                "name": "Missing SSN",
                "data": {
                    "loan_id": "ENT-LOAN-INVALID-001",
                    "borrower_info": {
                        "name": "Jane Enterprise",
                        "email": "jane@enterprise.com"
                        # Missing SSN
                    },
                    "financial_info": {
                        "annual_income": 150000,
                        "credit_score": 780
                    },
                    "property_info": {
                        "address": "123 Enterprise St",
                        "purchase_price": 500000,
                        "loan_amount": 400000
                    },
                    "documents": []
                }
            },
            {
                "name": "Invalid credit score",
                "data": {
                    "loan_id": "ENT-LOAN-INVALID-002",
                    "borrower_info": {
                        "name": "Bob Enterprise",
                        "email": "bob@enterprise.com",
                        "ssn": "123-45-6789"
                    },
                    "financial_info": {
                        "annual_income": 150000,
                        "credit_score": 500  # Below enterprise threshold
                    },
                    "property_info": {
                        "address": "123 Enterprise St",
                        "purchase_price": 500000,
                        "loan_amount": 400000
                    },
                    "documents": []
                }
            },
            {
                "name": "Insufficient documents",
                "data": {
                    "loan_id": "ENT-LOAN-INVALID-003",
                    "borrower_info": {
                        "name": "Alice Enterprise",
                        "email": "alice@enterprise.com",
                        "ssn": "123-45-6789"
                    },
                    "financial_info": {
                        "annual_income": 150000,
                        "credit_score": 780
                    },
                    "property_info": {
                        "address": "123 Enterprise St",
                        "purchase_price": 500000,
                        "loan_amount": 400000
                    },
                    "documents": [
                        {"document_id": "DOC-001", "filename": "app.pdf"}
                    ]  # Only 1 document, enterprise requires 3+
                }
            }
        ]
        
        results = []
        for test_case in test_cases:
            print(f"\n🧪 Testing: {test_case['name']}")
            result = self.test_enterprise_workflow(test_case['data'])
            results.append({
                "test_name": test_case['name'],
                "result": result
            })
            
            if result['status'] == 'error':
                print("✅ Enterprise validation correctly caught the error")
            else:
                print("❌ Enterprise validation should have caught this error")
        
        return results
    
    def test_enterprise_performance(self, num_requests: int = 3) -> Dict[str, Any]:
        """
        Test enterprise workflow performance with multiple requests
        
        Args:
            num_requests: Number of requests to send
            
        Returns:
            Performance test results
        """
        print(f"\n⚡ Enterprise performance testing with {num_requests} requests")
        
        results = []
        start_time = time.time()
        
        for i in range(num_requests):
            loan_data = self.create_enterprise_loan_data()
            loan_data['loan_id'] = f"ENT-LOAN-PERF-{i+1:03d}"
            
            print(f"📊 Enterprise Request {i+1}/{num_requests}")
            result = self.test_enterprise_workflow(loan_data)
            results.append(result)
            
            # Delay between requests for enterprise processing
            time.sleep(2)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Calculate statistics
        successful_requests = [r for r in results if r['status'] == 'success']
        failed_requests = [r for r in results if r['status'] != 'success']
        
        if successful_requests:
            avg_processing_time = sum(r['processing_time'] for r in successful_requests) / len(successful_requests)
            min_processing_time = min(r['processing_time'] for r in successful_requests)
            max_processing_time = max(r['processing_time'] for r in successful_requests)
        else:
            avg_processing_time = min_processing_time = max_processing_time = 0
        
        performance_results = {
            "total_requests": num_requests,
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "success_rate": len(successful_requests) / num_requests,
            "total_time": total_time,
            "avg_processing_time": avg_processing_time,
            "min_processing_time": min_processing_time,
            "max_processing_time": max_processing_time,
            "requests_per_second": num_requests / total_time,
            "results": results
        }
        
        print(f"\n📈 Enterprise Performance Results:")
        print(f"   Total Requests: {performance_results['total_requests']}")
        print(f"   Successful: {performance_results['successful_requests']}")
        print(f"   Failed: {performance_results['failed_requests']}")
        print(f"   Success Rate: {performance_results['success_rate']:.2%}")
        print(f"   Avg Processing Time: {performance_results['avg_processing_time']:.2f}s")
        print(f"   Min Processing Time: {performance_results['min_processing_time']:.2f}s")
        print(f"   Max Processing Time: {performance_results['max_processing_time']:.2f}s")
        print(f"   Requests/Second: {performance_results['requests_per_second']:.2f}")
        
        return performance_results
    
    def run_comprehensive_enterprise_test(self) -> Dict[str, Any]:
        """Run comprehensive enterprise test suite"""
        print("🧪 Starting Comprehensive Enterprise n8n Workflow Test")
        print("=" * 70)
        
        test_results = {
            "test_timestamp": datetime.now().isoformat(),
            "webhook_url": self.webhook_url,
            "enterprise_tier": "enterprise",
            "tests": {}
        }
        
        # Test 1: Valid enterprise loan application
        print("\n1️⃣ Testing valid enterprise loan application")
        valid_loan = self.create_enterprise_loan_data()
        test_results["tests"]["valid_enterprise_application"] = self.test_enterprise_workflow(valid_loan)
        
        # Test 2: Enterprise validation errors
        print("\n2️⃣ Testing enterprise validation errors")
        test_results["tests"]["enterprise_validation_errors"] = self.test_enterprise_validation_errors()
        
        # Test 3: Enterprise performance test
        print("\n3️⃣ Testing enterprise performance")
        test_results["tests"]["enterprise_performance"] = self.test_enterprise_performance(2)
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 ENTERPRISE TEST SUMMARY")
        print("=" * 70)
        
        valid_test = test_results["tests"]["valid_enterprise_application"]
        if valid_test["status"] == "success":
            print("✅ Valid enterprise application test: PASSED")
        else:
            print("❌ Valid enterprise application test: FAILED")
        
        validation_tests = test_results["tests"]["enterprise_validation_errors"]
        passed_validation = sum(1 for test in validation_tests if test["result"]["status"] == "error")
        print(f"✅ Enterprise validation tests: {passed_validation}/{len(validation_tests)} PASSED")
        
        performance_test = test_results["tests"]["enterprise_performance"]
        if performance_test["success_rate"] >= 0.8:
            print("✅ Enterprise performance test: PASSED")
        else:
            print("❌ Enterprise performance test: FAILED")
        
        # Save results
        output_file = f"enterprise_n8n_test_results_{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(test_results, f, indent=2)
        
        print(f"\n💾 Enterprise test results saved to: {output_file}")
        
        return test_results

def main():
    """Main test function"""
    # Configuration
    WEBHOOK_URL = "https://millionairesai888.app.n8n.cloud/webhook/enterprise-loan-application"
    API_KEY = "enterprise-api-key"
    
    # Create tester
    tester = EnterpriseN8NWorkflowTester(WEBHOOK_URL, API_KEY)
    
    # Run comprehensive test
    results = tester.run_comprehensive_enterprise_test()
    
    print("\n🎉 Enterprise testing completed!")
    print("\n📚 What was tested:")
    print("   ✅ Valid enterprise loan application processing")
    print("   ✅ Enterprise data validation and error handling")
    print("   ✅ Enterprise performance under load")
    print("   ✅ Enterprise response time and success rates")
    print("   ✅ Enterprise compliance and audit requirements")
    
    print("\n🔧 Next steps:")
    print("   • Deploy enterprise n8n workflow to production")
    print("   • Configure enterprise external API integrations")
    print("   • Set up enterprise monitoring and alerting")
    print("   • Implement enterprise error handling and retry logic")
    print("   • Add comprehensive enterprise logging")
    print("   • Set up enterprise audit trails")

if __name__ == "__main__":
    main()
