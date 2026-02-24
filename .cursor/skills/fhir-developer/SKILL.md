---
name: fhir-developer
description: Provides specialized knowledge of HL7 FHIR R4 for healthcare data exchange, including resource structures, cardinality rules, coding systems (LOINC, SNOMED CT, RxNorm), RESTful API patterns, and validation. Use when building or modifying FHIR resources, FHIR API endpoints, FHIR validation, or converting healthcare data to/from FHIR format in OpenEMR.
---

# FHIR Developer

Specialized knowledge of HL7 FHIR R4 for the OpenEMR project.

## Key FHIR R4 Resources (OpenEMR context)

| Resource | Use |
|----------|-----|
| Patient | Demographics, identifiers |
| Encounter | Visits, appointments |
| Observation | Vitals, lab results |
| Condition | Diagnoses (ICD-10) |
| MedicationRequest | Prescriptions |
| Practitioner | Providers |
| Organization | Facilities |
| AllergyIntolerance | Allergies |
| Immunization | Vaccines |
| DocumentReference | Clinical documents |
| DiagnosticReport | Lab/imaging reports |
| Procedure | Performed procedures |

## Cardinality Rules

- `0..1` — optional, at most one
- `1..1` — required, exactly one
- `0..*` — optional, multiple allowed
- `1..*` — at least one required

Always check cardinality before omitting a field. Required fields (1..1 or 1..*) must be present or the resource is invalid.

## Coding Systems

| System | URI | Use |
|--------|-----|-----|
| LOINC | `http://loinc.org` | Lab tests, vitals, observations |
| SNOMED CT | `http://snomed.info/sct` | Clinical findings, procedures |
| RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` | Medications |
| ICD-10-CM | `http://hl7.org/fhir/sid/icd-10-cm` | Diagnoses |
| CPT | `http://www.ama-assn.org/go/cpt` | Procedures |
| NPI | `http://hl7.org/fhir/sid/us-npi` | Provider identifiers |

Always use the full URI in `system` field, not abbreviations.

## RESTful API Patterns

```
GET    /fhir/r4/{Resource}/{id}          # Read
POST   /fhir/r4/{Resource}               # Create
PUT    /fhir/r4/{Resource}/{id}          # Update
DELETE /fhir/r4/{Resource}/{id}          # Delete
GET    /fhir/r4/{Resource}?{params}      # Search
GET    /fhir/r4/{Resource}/_history      # History
POST   /fhir/r4/                         # Batch/transaction bundle
```

Standard search params: `_id`, `_lastUpdated`, `_count`, `_offset`, `_sort`, `_include`, `_revinclude`

## OpenEMR FHIR Location

FHIR implementation lives in:
- `src/RestControllers/FHIR/` — controllers
- `src/Services/FHIR/` — service layer
- `src/Validators/FHIR/` — validators
- `API_README.md` / `FHIR_README.md` — docs

## Resource Structure Template

```json
{
  "resourceType": "ResourceName",
  "id": "logical-id",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-02-23T00:00:00Z"
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">...</div>"
  }
}
```

## Validation Checklist

- [ ] `resourceType` matches exactly (case-sensitive)
- [ ] All required (1..1) fields present
- [ ] `system` URIs are full canonical URLs
- [ ] Dates use ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDThh:mm:ssZ`)
- [ ] References use `"reference": "ResourceType/id"` format
- [ ] Identifiers include both `system` and `value`
- [ ] Narrative `text.div` has correct XHTML namespace

## Common Mistakes

- Using short system names (`"loinc"`) instead of full URIs
- Omitting `resourceType` field
- Using integer IDs instead of string IDs
- Bare references (`"12345"`) instead of typed references (`"Patient/12345"`)
- Missing required `status` field on most resources
