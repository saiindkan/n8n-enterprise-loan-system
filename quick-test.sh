#!/bin/bash

# Quick test for activated webhook
WEBHOOK_URL="https://millionairesai888.app.n8n.cloud/webhook-test/loan-application"

echo "🧪 Testing activated webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

# Test with valid data
echo "📋 Test 1: Valid loan application"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "TEST-LOAN-001",
    "borrower_name": "John Smith",
    "loan_amount": 350000,
    "property_address": "456 Oak Street, Austin, TX 78701",
    "annual_income": 95000,
    "credit_score": 750,
    "employment_status": "Full-time",
    "loan_purpose": "Primary Residence Purchase",
    "loan_term": 30,
    "property_value": 450000,
    "documents": [
      {
        "filename": "pay_stub.pdf",
        "mimeType": "application/pdf",
        "size": 2048,
        "content": "Pay stub showing $95,000 annual salary"
      }
    ],
    "source": "test_data",
    "processing_status": "ready_for_analysis"
  }' \
  --max-time 60 \
  --write-out "\nHTTP Status: %{http_code}\n" \
  --silent --show-error

echo ""
echo "📋 Test 2: Invalid data (should trigger error)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "TEST-LOAN-002",
    "borrower_name": "",
    "loan_amount": 25000
  }' \
  --max-time 60 \
  --write-out "\nHTTP Status: %{http_code}\n" \
  --silent --show-error
