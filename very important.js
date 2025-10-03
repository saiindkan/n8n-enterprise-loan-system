very important:

in the below ensure that the formatting is in place as expected, values are uniformly propogated, json code is fixed and workin, call this a new file called workling3 ensure you read each line carefully:

{
  "name": "Enterprise Loan Processing Workflow",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "loan-application",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "b32e5a1d-0a7c-4a96-b67c-63031833bb6d",
      "name": "Webhook JSON",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        -1680,
        -112
      ],
      "webhookId": "41beefc6-feb7-4794-b059-42c045bf7e8c"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "file-upload",
        "responseMode": "responseNode",
        "options": {
          "binaryData": false
        }
      },
      "id": "f3a47bdb-bff6-4a55-a511-87085a3317db",
      "name": "File Upload",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        -1456,
        184
      ],
      "webhookId": "58d36c9e-a796-4358-9d9d-18953c5d9927"
    },
    {
      "parameters": {
        "functionCode": "// Normalize JSON input\nconst data = $json.body || $json;\nreturn [{ json: { data, valid: true } }];"
      },
      "id": "06b96003-34d5-4616-95e0-58ca71b29a0a",
      "name": "Normalize JSON Input",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -1456,
        -112
      ]
    },
    {
      "parameters": {
        "functionCode": "// Parse S3 downloaded JSON file into $json.data\nconsole.log('S3 Input:', JSON.stringify($json, null, 2));\nconsole.log('Binary data:', $binary);\n\nlet parsed = null;\n\n// Check for binary data from S3 download\nif ($binary && $binary.data) {\n  console.log('Binary data found:', typeof $binary.data, $binary.data.length);\n  \n  try {\n    // S3 download with binaryData: true should give us the file content\n    let content = '';\n    \n    if (typeof $binary.data === 'string') {\n      content = $binary.data;\n    } else if ($binary.data.data) {\n      // Base64 encoded\n      content = Buffer.from($binary.data.data, 'base64').toString('utf8');\n    } else if (Buffer.isBuffer($binary.data)) {\n      content = $binary.data.toString('utf8');\n    }\n    \n    console.log('File content:', content.substring(0, 200) + '...');\n    \n    if (content) {\n      parsed = JSON.parse(content);\n      console.log('Successfully parsed JSON from S3 file');\n    }\n  } catch (e) {\n    console.log('Failed to parse S3 file content:', e.message);\n  }\n}\n\n// Fallback: check if we have loan data in the input\nif (!parsed || Object.keys(parsed).length === 0) {\n  const input = $json.body || $json;\n  console.log('Checking input for loan data:', input);\n  \n  if (input && typeof input === 'object') {\n    // Check if this is loan application data\n    if (input.loan_amount || input.borrower_name || input.applicant_name) {\n      parsed = input;\n      console.log('Using input as loan data');\n    }\n  }\n}\n\nconsole.log('Final parsed result:', parsed);\nreturn [{ json: { data: parsed || {}, source: 's3_parsed' } }];"
      },
      "id": "e4c3f679-9a4d-4e50-a3be-ade9de0f9ac8",
      "name": "Parse S3 JSON",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -1008,
        184
      ]
    },
    {
      "parameters": {
        "functionCode": "// Enhanced validation for both JSON and file upload\nconst data = $json.data || {};\nconst errors = [];\n\nif (!data.loan_id) errors.push('Missing loan_id');\nif (!data.borrower_name) errors.push('Missing borrower_name');\nif (!data.loan_amount) errors.push('Missing loan_amount');\n\nif (data.loan_amount && data.loan_amount < 50000) {\n  errors.push('Minimum loan amount is $50,000');\n}\nif (data.loan_amount && data.loan_amount > 2000000) {\n  errors.push('Maximum loan amount is $2,000,000');\n}\n\nif (data.documents && data.documents.length === 0) {\n  errors.push('At least one document is required');\n}\n\nif (errors.length > 0) {\n  return [{ json: { valid: false, errors, data } }];\n}\n\nreturn [{ json: { valid: true, data } }];"
      },
      "id": "23ab47ee-b55b-400a-8b39-0e8affdfd61d",
      "name": "Enhanced Validation",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -1232,
        -112
      ]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.valid }}",
              "value2": true
            }
          ]
        }
      },
      "id": "31369bc9-99d8-4f51-8450-32792f7d45fb",
      "name": "If Valid",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        -1008,
        -112
      ]
    },
    {
      "parameters": {
        "functionCode": "// Parse Document Processing response and merge with existing data\nconsole.log('Document Processing Response:', JSON.stringify($json, null, 2));\n\n// The AI response is in $json.text as a stringified JSON\nlet documentResults = null;\n\n// Try to parse the AI response from $json.text\nif ($json.text) {\n  try {\n    const parsedText = JSON.parse($json.text);\n    documentResults = parsedText.document_analysis;\n    console.log('Parsed document_analysis from text:', documentResults);\n  } catch (e) {\n    console.log('Failed to parse AI response text:', e.message);\n  }\n}\n\n// Fallback: check if document_analysis is directly available\nif (!documentResults && $json.document_analysis) {\n  documentResults = $json.document_analysis;\n}\n\n// If still no AI output, derive from parsed input (real data)\nif (!documentResults) {\n  const d = $json.data || {};\n  documentResults = {\n    borrower_info: {\n      full_name: String(d.applicant_name || d.borrower_name || ''),\n      ssn: String(d.ssn || ''),\n      phone: String(d.phone || ''),\n      email: String(d.email || ''),\n      address: String(d.current_address || d.property_address || '')\n    },\n    loan_details: {\n      loan_amount: Number(d.loan_amount ?? 0),\n      property_address: String(d.property_address || ''),\n      loan_purpose: String(d.loan_purpose || ''),\n      loan_term: Number(d.loan_term ?? 0)\n    },\n    financial_info: {\n      annual_income: Number(d.annual_income ?? 0),\n      employment_status: String(d.employment_status || ''),\n      credit_score: Number(d.credit_score ?? 0),\n      monthly_debt: Number(d.monthly_debt ?? 0)\n    },\n    documents_found: Array.isArray(d.documents) ? d.documents.map(x => x.filename || String(x)).filter(Boolean) : [],\n    confidence_score: 0.9\n  };\n}\n\n// Normalize types and ensure presence\nconst safeDoc = {\n  borrower_info: {\n    full_name: String(documentResults?.borrower_info?.full_name || ''),\n    ssn: String(documentResults?.borrower_info?.ssn || ''),\n    phone: String(documentResults?.borrower_info?.phone || ''),\n    email: String(documentResults?.borrower_info?.email || ''),\n    address: String(documentResults?.borrower_info?.address || '')\n  },\n  loan_details: {\n    loan_amount: Number(documentResults?.loan_details?.loan_amount ?? 0),\n    property_address: String(documentResults?.loan_details?.property_address || ''),\n    loan_purpose: String(documentResults?.loan_details?.loan_purpose || ''),\n    loan_term: Number(documentResults?.loan_details?.loan_term ?? 0)\n  },\n  financial_info: {\n    annual_income: Number(documentResults?.financial_info?.annual_income ?? 0),\n    employment_status: String(documentResults?.financial_info?.employment_status || ''),\n    credit_score: Number(documentResults?.financial_info?.credit_score ?? 0),\n    monthly_debt: Number(documentResults?.financial_info?.monthly_debt ?? 0)\n  },\n  documents_found: Array.isArray(documentResults?.documents_found) ? documentResults.documents_found : [],\n  confidence_score: Number(documentResults?.confidence_score ?? 0)\n};\n\nconst mergedData = {\n  ...($json.data || {}),\n  document_results: safeDoc\n};\n\nconsole.log('Merged Document Data:', JSON.stringify(mergedData, null, 2));\nreturn [{ json: { data: mergedData } }];"
      },
      "id": "323e1f8c-5eb6-4faa-a489-57e758d61a24",
      "name": "Merge Document Results",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -432,
        144
      ]
    },
    {
      "parameters": {
        "functionCode": "// Parse Risk Assessment response and merge with existing data\nconsole.log('Risk Assessment Response:', JSON.stringify($json, null, 2));\n\n// The AI response is in $json.text as a stringified JSON\nlet riskResults = null;\n\n// Try to parse the AI response from $json.text\nif ($json.text) {\n  try {\n    const parsedText = JSON.parse($json.text);\n    riskResults = parsedText.risk_analysis;\n    console.log('Parsed risk_analysis from text:', riskResults);\n  } catch (e) {\n    console.log('Failed to parse AI response text:', e.message);\n  }\n}\n\n// Fallback: check if risk_analysis is directly available\nif (!riskResults && $json.risk_analysis) {\n  riskResults = $json.risk_analysis;\n}\n\n// If still no AI output, use fallback\nif (!riskResults) {\n  riskResults = {\n    overall_risk_score: 25,\n    credit_risk: 5,\n    market_risk: 10,\n    operational_risk: 10,\n    risk_level: 'LOW',\n    debt_to_income_ratio: 0.22,\n    recommendations: ['Standard risk assessment'],\n    approval_recommendation: 'approve'\n  };\n}\n\n// Normalize values and ensure presence\nconst safeRisk = {\n  overall_risk_score: Number(riskResults?.overall_risk_score ?? 0),\n  credit_risk: Number(riskResults?.credit_risk ?? 0),\n  market_risk: Number(riskResults?.market_risk ?? 0),\n  operational_risk: Number(riskResults?.operational_risk ?? 0),\n  risk_level: String(riskResults?.risk_level || 'UNKNOWN'),\n  debt_to_income_ratio: Number(riskResults?.debt_to_income_ratio ?? 0),\n  recommendations: Array.isArray(riskResults?.recommendations) ? riskResults.recommendations : [],\n  approval_recommendation: String(riskResults?.approval_recommendation || '')\n};\n\nconst mergedData = {\n  ...($json.data || {}),\n  risk_results: safeRisk\n};\n\nconsole.log('Merged Risk Data:', JSON.stringify(mergedData, null, 2));\nreturn [{ json: { data: mergedData } }];"
      },
      "id": "12761583-28ca-48f1-bf9b-39dda02e8db4",
      "name": "Merge Risk Results",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        144,
        144
      ]
    },
    {
      "parameters": {
        "functionCode": "// Parse Compliance response and merge with existing data\nconsole.log('Compliance Response:', JSON.stringify($json, null, 2));\n\n// The AI response is in $json.text as a stringified JSON\nlet complianceResults = null;\n\n// Try to parse the AI response from $json.text\nif ($json.text) {\n  try {\n    const parsedText = JSON.parse($json.text);\n    complianceResults = parsedText.compliance_results;\n    console.log('Parsed compliance_results from text:', complianceResults);\n  } catch (e) {\n    console.log('Failed to parse AI response text:', e.message);\n  }\n}\n\n// Fallback: check if compliance_results is directly available\nif (!complianceResults && $json.compliance_results) {\n  complianceResults = $json.compliance_results;\n}\n\n// If still no AI output, use fallback\nif (!complianceResults) {\n  complianceResults = {\n    compliance_status: 'compliant',\n    regulations_checked: ['TRID', 'HMDA', 'ECOA', 'CRA', 'FCRA', 'GLBA', 'AML'],\n    compliance_score: 95,\n    violations: [],\n    recommendations: ['All regulations compliant'],\n    risk_flags: []\n  };\n}\n\n// Normalize and ensure presence\nconst safeCompliance = {\n  compliance_status: String(complianceResults?.compliance_status || 'review_needed'),\n  regulations_checked: Array.isArray(complianceResults?.regulations_checked) ? complianceResults.regulations_checked : [],\n  compliance_score: Number(complianceResults?.compliance_score ?? 0),\n  violations: Array.isArray(complianceResults?.violations) ? complianceResults.violations : [],\n  recommendations: Array.isArray(complianceResults?.recommendations) ? complianceResults.recommendations : [],\n  risk_flags: Array.isArray(complianceResults?.risk_flags) ? complianceResults.risk_flags : []\n};\n\nconst mergedData = {\n  ...($json.data || {}),\n  compliance_results: safeCompliance\n};\n\nconsole.log('Merged Compliance Data:', JSON.stringify(mergedData, null, 2));\nreturn [{ json: { data: mergedData } }];"
      },
      "id": "694046ef-beab-4830-a306-c8134f4fe97c",
      "name": "Merge Compliance Results",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        720,
        136
      ]
    },
    {
      "parameters": {
        "functionCode": "// Parse Decision Making response and merge with existing data\nconsole.log('Decision Making Response:', JSON.stringify($json, null, 2));\n\n// The Decision Making agent returns data directly in $json.decision_results\nlet decisionResults = {};\nif ($json.decision_results) {\n  decisionResults = $json.decision_results;\n} else {\n  // Fallback if structure is different\n  decisionResults = {\n    decision: 'APPROVED',\n    confidence: 0.92,\n    interest_rate: 6.5,\n    loan_term: 30,\n    reasoning: 'Strong credit profile and adequate income',\n    conditions: []\n  };\n}\n\n// Merge with existing data\nconst base = $json.data || {};\nconst mergedData = {\n  ...base,\n  decision_results: decisionResults\n};\n\n// Monthly payment calc (principal, APR %, months)\nfunction calcMonthlyPayment(principal, annualRate, months) {\n  if (principal == null || annualRate == null || months == null) return null;\n  if (months === 0) return null;\n  const r = (annualRate / 100) / 12;\n  if (r === 0) return +(principal / months).toFixed(2);\n  const pow = Math.pow(1 + r, months);\n  const payment = principal * r * pow / (pow - 1);\n  return +payment.toFixed(2);\n}\n\n// Standardized fields with robust fallbacks\nfunction generateApplicationId() {\n  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();\n  return `APP-${Date.now()}-${rand}`;\n}\nconst application_id = mergedData.loan_id || mergedData.application_id || ($json.data && $json.data.loan_id) || $json.loan_id || generateApplicationId();\nconst applicant_name = mergedData.borrower_name || mergedData.document_results?.borrower_info?.full_name || mergedData.applicant_name || '';\nconst credit_score = mergedData.document_results?.financial_info?.credit_score ?? mergedData.credit_score ?? 750;\nconst loan_amount = mergedData.document_results?.loan_details?.loan_amount ?? mergedData.loan_amount ?? 350000;\nconst loan_term_months = (decisionResults.loan_term != null) ? decisionResults.loan_term * 12 : null;\nconst monthly_payment = calcMonthlyPayment(loan_amount, decisionResults.interest_rate ?? null, loan_term_months);\nconst processing_time_seconds = mergedData.processing_time_seconds ?? 0;\nconst risk_score = mergedData.risk_results?.overall_risk_score ?? mergedData.risk_score ?? 0.25;\nconst status = decisionResults.decision || mergedData.status || 'UNKNOWN';\nconst timestamp = new Date().toISOString();\n\nconst finalData = {\n  ...mergedData,\n  application_id,\n  applicant_name,\n  credit_score,\n  decision: decisionResults.decision || null,\n  decision_reason: decisionResults.reasoning || null,\n  interest_rate: (decisionResults.interest_rate != null) ? decisionResults.interest_rate : null,\n  loan_amount,\n  loan_term_months,\n  monthly_payment: monthly_payment ?? 0,\n  processing_time_seconds,\n  risk_score,\n  status,\n  timestamp\n};\n\nconsole.log('Merged Decision Data:', JSON.stringify(finalData, null, 2));\nreturn [{ json: { data: finalData } }];"
      },
      "id": "70f09d34-34db-4764-90ea-4a1b7a13cf6a",
      "name": "Merge Decision Results",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        1296,
        136
      ]
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "c9965816-a99a-4303-9cc9-95dba15641aa",
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1744,
        136
      ]
    },
    {
      "parameters": {
        "tableName": "loan-decisions",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "application_id",
              "fieldValue": "={{ $json.data.application_id || $json.data.loan_id || 'UNKNOWN' }}"
            },
            {
              "fieldId": "applicant_name",
              "fieldValue": "={{ $json.data.applicant_name || $json.data.borrower_name || 'John Smith' }}"
            },
            {
              "fieldId": "credit_score",
              "fieldValue": "={{ $json.data.credit_score || $json.data.document_results?.financial_info?.credit_score || 750 }}"
            },
            {
              "fieldId": "decision",
              "fieldValue": "={{ $json.data.decision || $json.data.decision_results?.decision || 'UNKNOWN' }}"
            },
            {
              "fieldId": "decision_reason",
              "fieldValue": "={{ $json.data.decision_reason || $json.data.decision_results?.reasoning || '' }}"
            },
            {
              "fieldId": "interest_rate",
              "fieldValue": "={{ $json.data.interest_rate || $json.data.decision_results?.interest_rate || 0 }}"
            },
            {
              "fieldId": "loan_amount",
              "fieldValue": "={{ $json.data.loan_amount || $json.data.document_results?.loan_details?.loan_amount || 350000 }}"
            },
            {
              "fieldId": "loan_term_months",
              "fieldValue": "={{ $json.data.loan_term_months ?? 0 }}"
            },
            {
              "fieldId": "monthly_payment",
              "fieldValue": "={{ $json.data.monthly_payment ?? 0 }}"
            },
            {
              "fieldId": "processing_time_seconds",
              "fieldValue": "={{ $json.data.processing_time_seconds ?? 0 }}"
            },
            {
              "fieldId": "risk_score",
              "fieldValue": "={{ $json.data.risk_score || $json.data.risk_results?.overall_risk_score || 0.25 }}"
            },
            {
              "fieldId": "status",
              "fieldValue": "={{ $json.data.status || $json.data.decision_results?.decision || 'UNKNOWN' }}"
            },
            {
              "fieldId": "timestamp",
              "fieldValue": "={{ $json.data.timestamp || (new Date()).toISOString() }}"
            }
          ]
        },
        "additionalFields": {}
      },
      "id": "96916637-0dfb-4608-9d3c-2041d1eb3c59",
      "name": "Save to DynamoDB",
      "type": "n8n-nodes-base.awsDynamoDb",
      "typeVersion": 1,
      "position": [
        1520,
        136
      ],
      "credentials": {
        "aws": {
          "id": "DVs7dBmJBeDHSSO2",
          "name": "AWS account"
        }
      }
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "8c515ed5-b920-4cea-bd4e-63e3844aef7c",
      "name": "Error Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        -720,
        -160
      ]
    },
    {
      "parameters": {
        "model": "anthropic.claude-3-haiku-20240307-v1:0",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatAwsBedrock",
      "typeVersion": 1.1,
      "position": [
        -712,
        360
      ],
      "id": "8629d2c5-4e9c-4ac7-90e3-27877ed7be0c",
      "name": "Document Processing - AWS Bedrock Titan",
      "credentials": {
        "aws": {
          "id": "DVs7dBmJBeDHSSO2",
          "name": "AWS account"
        }
      }
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=You are an expert document processing AI specialist. Analyze the provided loan application data and extract structured information with high accuracy.\n\nIMPORTANT: Use the actual input data provided below. Do not generate fictional information.\n\nInput data to process:\nApplicant Name: {{ $json.data.applicant_name }}\nLoan Amount: {{ $json.data.loan_amount }}\nCredit Score: {{ $json.data.credit_score }}\nAnnual Income: {{$json.data.annual_income}}\nProperty Address: {{ $json.data.property_address }}\nPhone: {{ $json.data.phone }}\nEmail: {{ $json.data.email }}\nSSN: {{ $json.data.ssn }}\nEmployment Status: {{ $json.data.employment_status }}\nEmployer Name: {{ $json.data.employer_name }}\nMonthly Debt: {{ $json.data.monthly_debt }}\nLoan Purpose: {{ $json.data.loan_purpose }}\nLoan Term: {{ $json.data.loan_term }}\nCurrent Address: {{ $json.data.current_address }}\nDocuments: {{ $json.data.documents }}\nApplication Notes: {{ $json.data.application_notes }}\n\nExtract the following information from the actual input data:\n- Borrower: full name, SSN, DOB, contact details, current address\n- Loan Details: requested amount, property address, loan purpose, loan term\n- Financial Info: annual income, employment status, employer name, credit score, monthly debts\n- Documents: list all documents present (pay stubs, tax returns, bank statements, etc.)\n\nReturn JSON with structure:\n{\n  \"document_analysis\": {\n    \"borrower_info\": {\"full_name\": \"string\", \"ssn\": \"string\", \"phone\": \"string\", \"email\": \"string\", \"address\": \"string\"},\n    \"loan_details\": {\"loan_amount\": number, \"property_address\": \"string\", \"loan_purpose\": \"string\", \"loan_term\": number},\n    \"financial_info\": {\"annual_income\": number, \"employment_status\": \"string\", \"credit_score\": number, \"monthly_debt\": number},\n    \"documents_found\": [\"array\"],\n    \"confidence_score\": number\n  }\n} ",
        "batching": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.7,
      "position": [
        -784,
        136
      ],
      "id": "b630ee6d-8e47-43bc-a1e8-8c2704e22148",
      "name": "Document Processing Agent"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=You are a Senior Risk Analyst AI. Perform comprehensive risk analysis using ONLY the exact values provided below.\n\nInputs:\n- Borrower Name: {{ $json.data.document_results.borrower_info.full_name }}\n- Credit Score: {{ $json.data.document_results.financial_info.credit_score }}\n- Annual Income: {{ $json.data.document_results.financial_info.annual_income }}\n- Monthly Debt: {{ $json.data.document_results.financial_info.monthly_debt }}\n- Employment Status: {{ $json.data.document_results.financial_info.employment_status }}\n- Loan Amount: {{ $json.data.document_results.loan_details.loan_amount }}\n- Loan Term (years): {{ $json.data.document_results.loan_details.loan_term }}\n- Loan Purpose: {{ $json.data.document_results.loan_details.loan_purpose }}\n- Property Address: {{ $json.data.document_results.loan_details.property_address }}\n\nAnalyze the loan data and return strictly this JSON:\n{\n  \"risk_analysis\": {\n    \"overall_risk_score\": number,\n    \"credit_risk\": number,\n    \"market_risk\": number,\n    \"operational_risk\": number,\n    \"risk_level\": \"LOW|MEDIUM|HIGH\",\n    \"debt_to_income_ratio\": number,\n    \"recommendations\": [\"array of risk mitigation recommendations\"],\n    \"approval_recommendation\": \"approve|deny|review\"\n  }\n}\nDo not fabricate values; leave any unknown numeric field as 0 and strings as \"\".",
        "batching": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.7,
      "position": [
        -208,
        136
      ],
      "id": "9861b135-c15e-411d-bab7-b9ffa8f29154",
      "name": "Risk Assessment"
    },
    {
      "parameters": {
        "model": "anthropic.claude-3-haiku-20240307-v1:0",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatAwsBedrock",
      "typeVersion": 1.1,
      "position": [
        -136,
        360
      ],
      "id": "345b609d-2124-48e1-9957-29902f65f7ba",
      "name": "Risk Assessment - AWS Bedrock Claude",
      "credentials": {
        "aws": {
          "id": "DVs7dBmJBeDHSSO2",
          "name": "AWS account"
        }
      }
    },
    {
      "parameters": {
        "model": "anthropic.claude-3-haiku-20240307-v1:0",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatAwsBedrock",
      "typeVersion": 1.1,
      "position": [
        440,
        360
      ],
      "id": "410c7e67-4eec-483b-b919-35838c017048",
      "name": "Compliance Check - AWS Bedrock Claude",
      "credentials": {
        "aws": {
          "id": "DVs7dBmJBeDHSSO2",
          "name": "AWS account"
        }
      }
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=You are a Senior Compliance Officer AI. Analyze loan documents for regulatory compliance using ONLY the exact values provided below.\n\nInputs:\n- Risk Level: {{ $json.data.risk_results.risk_level }}\n- Overall Risk Score: {{ $json.data.risk_results.overall_risk_score }}\n- Credit Risk: {{ $json.data.risk_results.credit_risk }}\n- Market Risk: {{ $json.data.risk_results.market_risk }}\n- Operational Risk: {{ $json.data.risk_results.operational_risk }}\n- Debt-to-Income Ratio: {{ $json.data.risk_results.debt_to_income_ratio }}\n- Risk Recommendations: {{ $json.data.risk_results.recommendations }}\n- Approval Recommendation: {{ $json.data.risk_results.approval_recommendation }}\n\nReview compliance with:\n- TRID (TILA-RESPA Integrated Disclosure)\n- HMDA (Home Mortgage Disclosure Act)\n- ECOA (Equal Credit Opportunity Act)\n- CRA (Community Reinvestment Act)\n- FCRA (Fair Credit Reporting Act)\n- GLBA (Gramm-Leach-Bliley Act)\n- AML (Anti-Money Laundering regulations)\n\nReturn strictly this JSON:\n{\n  \"compliance_results\": {\n    \"compliance_status\": \"compliant|non_compliant|review_needed\",\n    \"regulations_checked\": [\"TRID\", \"HMDA\", \"ECOA\", \"CRA\", \"FCRA\", \"GLBA\", \"AML\"],\n    \"compliance_score\": number,\n    \"violations\": [\"array of violation descriptions\"],\n    \"recommendations\": [\"array of compliance actions needed\"],\n    \"risk_flags\": [\"array of compliance risks\"]\n  }\n}\nDo not fabricate values; leave any unknown numeric field as 0 and strings as \"\".",
        "batching": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.7,
      "position": [
        368,
        136
      ],
      "id": "84bf8850-5f9f-486c-b0e8-28587d02ab22",
      "name": "Compliance Agent"
    },
    {
      "parameters": {
        "model": "anthropic.claude-3-haiku-20240307-v1:0",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatAwsBedrock",
      "typeVersion": 1.1,
      "position": [
        1016,
        360
      ],
      "id": "13e5fe49-92c7-4a1d-a43d-1b9329ac91bb",
      "name": "Decision Making - AWS Bedrock Claude",
      "credentials": {
        "aws": {
          "id": "DVs7dBmJBeDHSSO2",
          "name": "AWS account"
        }
      }
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=You are a Senior Loan Officer AI. Make strategic loan decisions using ONLY the exact values provided below.\n\nInputs:\n- Compliance Status: {{ $json.data.compliance_results.compliance_status }}\n- Compliance Score: {{ $json.data.compliance_results.compliance_score }}\n- Regulations Checked: {{ $json.data.compliance_results.regulations_checked }}\n- Violations: {{ $json.data.compliance_results.violations }}\n- Compliance Recommendations: {{ $json.data.compliance_results.recommendations }}\n- Risk Flags: {{ $json.data.compliance_results.risk_flags }}\n\nBased on all previous assessments, make a final loan approval or denial decision.\n\nConsider:\n- Document analysis results and borrower information\n- Risk assessment scores and risk level\n- Compliance check results and any violations\n- Business objectives and lending criteria\n- Current market conditions\n\nReturn strictly this JSON:\n{\n  \"decision_results\": {\n    \"decision\": \"APPROVED|DENIED|CONDITIONAL\",\n    \"confidence\": number,\n    \"interest_rate\": number,\n    \"loan_term\": number,\n    \"approval_amount\": number,\n    \"conditions\": [\"array of approval conditions\"],\n    \"reasoning\": \"detailed explanation\",\n    \"stipulations\": [\"array of required documents or actions\"]\n  }\n}\nDo not fabricate values; leave any unknown numeric field as 0 and strings as \"\".",
        "batching": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.7,
      "position": [
        944,
        144
      ],
      "id": "4c7ad7b2-49cc-4fc7-be27-ffc42e76e0f8",
      "name": "Decision Making"
    },
    {
      "parameters": {
        "bucketName": "ai-loan-docs-millionaire-20250923-01",
        "fileKey": "={{ $json[\"body\"][\"key\"] }}"
      },
      "type": "n8n-nodes-base.awsS3",
      "typeVersion": 2,
      "position": [
        -1232,
        184
      ],
      "id": "1c779f7d-d594-41fb-b01c-32f28c9d6d95",
      "name": "Download a file",
      "credentials": {
        "aws": {
          "id": "DVs7dBmJBeDHSSO2",
          "name": "AWS account"
        }
      }
    }
  ],
  "pinData": {},
  "connections": {
    "Webhook JSON": {
      "main": [
        [
          {
            "node": "Normalize JSON Input",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "File Upload": {
      "main": [
        [
          {
            "node": "Download a file",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Normalize JSON Input": {
      "main": [
        [
          {
            "node": "Enhanced Validation",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enhanced Validation": {
      "main": [
        [
          {
            "node": "If Valid",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If Valid": {
      "main": [
        [
          {
            "node": "Document Processing Agent",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Error Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Document Results": {
      "main": [
        [
          {
            "node": "Risk Assessment",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Risk Results": {
      "main": [
        [
          {
            "node": "Compliance Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Compliance Results": {
      "main": [
        [
          {
            "node": "Decision Making",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Decision Results": {
      "main": [
        [
          {
            "node": "Save to DynamoDB",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Save to DynamoDB": {
      "main": [
        [
          {
            "node": "Success Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Document Processing - AWS Bedrock Titan": {
      "ai_languageModel": [
        [
          {
            "node": "Document Processing Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Document Processing Agent": {
      "main": [
        [
          {
            "node": "Merge Document Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Risk Assessment": {
      "main": [
        [
          {
            "node": "Merge Risk Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Risk Assessment - AWS Bedrock Claude": {
      "ai_languageModel": [
        [
          {
            "node": "Risk Assessment",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Compliance Check - AWS Bedrock Claude": {
      "ai_languageModel": [
        [
          {
            "node": "Compliance Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Compliance Agent": {
      "main": [
        [
          {
            "node": "Merge Compliance Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Decision Making - AWS Bedrock Claude": {
      "ai_languageModel": [
        [
          {
            "node": "Decision Making",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Decision Making": {
      "main": [
        [
          {
            "node": "Merge Decision Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Download a file": {
      "main": [
        [
          {
            "node": "Parse S3 JSON",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse S3 JSON": {
      "main": [
        [
          {
            "node": "Document Processing Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "b9f265ed-5e2f-4385-8340-b0d7982aa101",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "e1d4332a31ff94cc8efabea56e2db8b1aa243117e07b80339b81356f2de6667a"
  },
  "id": "9Tc0OdEVRe6sexSq",
  "tags": []
}