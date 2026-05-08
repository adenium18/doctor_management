import HeightWeightInput from "./HeightWeightInput.js";

export default {
  components: { HeightWeightInput },
  template: `
  <div class="cp-root" style="min-height:100vh;background:#f4f6fb">

    <!-- ═══════════════════ STICKY HEADER ═══════════════════ -->
    <div class="d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom sticky-top shadow-sm d-print-none"
         style="z-index:130;min-height:52px">
      <div class="d-flex align-items-center gap-2">
        <button v-if="isEdit" class="btn btn-sm btn-outline-secondary px-2"
                @click="$router.push('/casepapers')">← Records</button>
        <div>
          <div class="fw-bold" style="font-size:13px;line-height:1.3">
            <span v-if="patient.full_name">{{ patient.full_name }}</span>
            <span v-else>{{ isEdit ? 'Edit Casepaper' : 'New Casepaper' }}</span>
            <span v-if="patient.age" class="text-muted fw-normal ms-1" style="font-size:12px">
              · {{ patient.age }}y{{ patient.sex ? ' ' + patient.sex : '' }}
            </span>
          </div>
          <div class="text-muted" style="font-size:11px">
            <span v-if="isEdit">Editing record #{{ $route.params.id }}</span>
            <span v-else-if="autosaveLabel" class="text-success">{{ autosaveLabel }}</span>
            <span v-else>{{ steps[activeStep].icon }} {{ steps[activeStep].label }}</span>
          </div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary d-none d-md-inline-flex align-items-center gap-1"
                @click="printPrescription">
          <span>🖨</span> Print Rx
        </button>
        <button class="btn btn-sm btn-primary" @click="isEdit ? triggerSave() : openReview()"
                :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" style="width:12px;height:12px"></span>
          {{ saving ? 'Saving…' : (isEdit ? 'Update' : 'Review & Save') }}
        </button>
      </div>
    </div>

    <!-- ═══════════════════ STEPPER – DESKTOP ═══════════════════ -->
    <div class="d-none d-md-block bg-white border-bottom d-print-none" style="overflow-x:auto">
      <div class="px-4 pt-3 pb-0" style="min-width:740px">
        <div class="d-flex align-items-start">
          <template v-for="(step, i) in steps">
            <div v-if="i > 0" class="flex-grow-1 mt-4" style="height:2px;border-radius:1px;transition:background .3s"
                 :style="{ background: stepDone(i-1) ? '#198754' : '#dee2e6' }"></div>
            <div class="d-flex flex-column align-items-center text-center"
                 style="cursor:pointer;flex-shrink:0;width:76px"
                 @click="goToStep(i)">
              <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold border"
                   style="width:36px;height:36px;font-size:13px;transition:all .25s;flex-shrink:0"
                   :style="circleStyle(i)">
                <span v-if="stepDone(i) && activeStep !== i && !stepHasError(i)">✓</span>
                <span v-else-if="stepHasError(i)">!</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div class="mt-1" style="font-size:10px;line-height:1.3;transition:color .2s"
                   :style="labelStyle(i)">
                <div>{{ step.icon }}</div>
                <div>{{ step.label }}</div>
              </div>
            </div>
          </template>
        </div>
        <div class="d-flex mt-2">
          <div v-for="(step, i) in steps" :key="i" class="flex-grow-1"
               style="height:3px;border-radius:2px;transition:background .3s"
               :style="{ background: i === activeStep ? '#0d6efd' : stepDone(i) ? '#198754' : 'transparent' }">
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ STEPPER – MOBILE ═══════════════════ -->
    <div class="d-md-none bg-white border-bottom d-print-none px-3 py-2">
      <div class="progress mb-1" style="height:4px;border-radius:2px">
        <div class="progress-bar bg-primary transition" :style="{ width: progressPct + '%' }"></div>
      </div>
      <div class="d-flex align-items-center justify-content-between">
        <div style="font-size:12px">
          <span class="text-muted">Step {{ activeStep + 1 }}/{{ steps.length }}</span>
          <span class="ms-2 fw-semibold" :style="{ color: stepHasError(activeStep) ? '#dc3545' : '#0d6efd' }">
            {{ steps[activeStep].icon }} {{ steps[activeStep].label }}
          </span>
        </div>
        <div class="d-flex gap-1">
          <button v-for="(step, i) in steps" :key="i"
                  class="rounded-circle border-0"
                  style="width:8px;height:8px;padding:0;transition:all .2s"
                  :style="{ background: i === activeStep ? '#0d6efd' : stepDone(i) ? '#198754' : stepHasError(i) ? '#dc3545' : '#dee2e6' }"
                  @click="goToStep(i)">
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ MAIN CONTENT ═══════════════════ -->
    <div class="py-3 px-2 px-md-4 d-print-none" style="max-width:980px;margin:0 auto">

      <!-- ─── STEP 0 · PATIENT ─────────────────────────────── -->
      <div v-show="activeStep === 0">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 d-flex justify-content-between align-items-start border-bottom">
            <div>
              <h6 class="mb-0 fw-bold" style="color:#0d6efd">👤 Patient Information</h6>
              <p class="text-muted small mb-0 mt-1">Search for an existing patient or create a new one</p>
            </div>
            <span v-if="patient.id" class="badge bg-success-subtle text-success px-2 py-1" style="font-size:11px">
              ✓ Existing Patient
            </span>
            <span v-else-if="showPatientForm" class="badge bg-warning-subtle text-warning px-2 py-1" style="font-size:11px">
              New Patient
            </span>
          </div>
          <div class="card-body">
            <!-- Search autocomplete -->
            <div class="mb-4" v-click-outside="closeDropdown">
              <label class="form-label fw-semibold">Search Patient</label>
              <div class="position-relative">
                <div class="input-group input-group-lg" style="border-radius:10px;overflow:hidden">
                  <span class="input-group-text bg-white border-end-0 text-muted">🔍</span>
                  <input v-model="patientQuery"
                    class="form-control border-start-0 ps-0"
                    placeholder="Type patient name or phone…"
                    autocomplete="off"
                    style="font-size:15px"
                    @input="onPatientSearch"
                    @focus="dropdownOpen = true" />
                  <button v-if="patient.id" class="btn btn-success px-3" style="font-size:13px" @click="clearPatient">
                    ✓ Selected — Change
                  </button>
                  <button v-else class="btn btn-outline-primary px-3" style="font-size:13px" @click="useNewPatient">
                    + New Patient
                  </button>
                </div>
                <!-- Dropdown results -->
                <div v-if="dropdownOpen && (patientResults.length || patientQuery.length > 1)"
                  class="position-absolute w-100 bg-white border rounded-3 shadow-lg"
                  style="z-index:400;top:calc(100%+4px);max-height:300px;overflow-y:auto;margin-top:4px">
                  <div v-for="p in patientResults" :key="p.id"
                    class="px-3 py-2 border-bottom d-flex align-items-center gap-3"
                    style="cursor:pointer;transition:background .15s"
                    :style="hoveredPatient===p.id ? 'background:#f0f7ff' : ''"
                    @mouseover="hoveredPatient=p.id"
                    @mouseleave="hoveredPatient=null"
                    @mousedown.prevent="selectPatient(p)">
                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                         style="width:38px;height:38px;font-size:14px">
                      {{ (p.full_name||'?')[0].toUpperCase() }}
                    </div>
                    <div class="flex-grow-1 min-width-0">
                      <div class="fw-semibold" style="font-size:14px">{{ p.full_name }}</div>
                      <div class="text-muted" style="font-size:12px">
                        {{ [p.age ? p.age+'y' : '', p.sex, p.phone].filter(Boolean).join(' · ') }}
                        <span v-if="p.last_visit" class="ms-2 badge bg-success-subtle text-success" style="font-size:10px">
                          Last visit {{ formatDate(p.last_visit) }}
                        </span>
                      </div>
                    </div>
                    <button class="btn btn-sm btn-primary flex-shrink-0" @mousedown.prevent="selectPatient(p)">
                      Select
                    </button>
                  </div>
                  <div v-if="!patientResults.length && patientQuery.length > 1"
                       class="px-3 py-2 text-muted small text-center">
                    No existing patients found for "{{ patientQuery }}"
                  </div>
                  <div v-if="patientQuery.length > 1"
                    class="px-3 py-2 d-flex align-items-center gap-2 border-top"
                    style="cursor:pointer;background:#f8f9ff"
                    @mousedown.prevent="useNewPatient">
                    <span class="text-primary fw-semibold" style="font-size:13px">+ Register "{{ patientQuery }}" as new patient</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Patient form fields -->
            <div v-if="showPatientForm">
              <div v-if="patient.id" class="alert alert-info d-flex align-items-center gap-2 py-2 px-3 mb-3" style="font-size:13px;border-radius:8px">
                <span>ℹ️</span>
                <span>Existing patient — details are pre-filled and locked for accuracy.</span>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Full Name <span class="text-danger">*</span></label>
                  <input v-model="patient.full_name"
                    class="form-control"
                    :class="{ 'is-invalid': errors.full_name, 'is-valid': patient.full_name.trim() && !errors.full_name }"
                    :readonly="!!patient.id"
                    placeholder="Patient's full name"
                    @blur="validate('full_name')" />
                  <div v-if="errors.full_name" class="invalid-feedback fw-semibold">⚠ {{ errors.full_name }}</div>
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Date of Birth</label>
                  <input v-model="patient.dob" type="date" class="form-control"
                    :readonly="!!patient.id" :max="today" min="1900-01-01" @change="calcAge" />
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Age (years)</label>
                  <input v-model.number="patient.age" type="number" class="form-control"
                    :readonly="!!patient.id" placeholder="Auto from DOB" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label fw-semibold">Gender</label>
                  <select v-model="patient.sex" class="form-select" :disabled="!!patient.id">
                    <option value="">—</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label fw-semibold">Weight (kg)</label>
                  <input v-model.number="patient.weight" type="number" step="0.1" class="form-control" :readonly="!!patient.id" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label fw-semibold">Height (cm)</label>
                  <input v-model.number="patient.height" type="number" step="0.1" class="form-control" :readonly="!!patient.id" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label fw-semibold">Blood Group</label>
                  <select v-model="patient.blood_group" class="form-select" :disabled="!!patient.id">
                    <option value="">—</option>
                    <option v-for="bg in bloodGroups" :key="bg">{{ bg }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Phone</label>
                  <input v-model="patient.phone" type="tel" class="form-control"
                    :class="{ 'is-invalid': errors.phone }"
                    :readonly="!!patient.id"
                    placeholder="10-digit number"
                    @blur="validate('phone')" />
                  <div v-if="errors.phone" class="invalid-feedback">⚠ {{ errors.phone }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Emergency Contact</label>
                  <input v-model="patient.emergency_contact" class="form-control" :readonly="!!patient.id" placeholder="Name & phone" />
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Pincode</label>
                  <input v-model="patient.pincode" class="form-control" :readonly="!!patient.id" />
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Address</label>
                  <input v-model="patient.address" class="form-control" :readonly="!!patient.id" />
                </div>
              </div>
            </div>

            <div v-else class="text-center py-5">
              <div style="font-size:52px">👤</div>
              <p class="text-muted mt-2 mb-0">Search for a patient above, or click <strong>+ New Patient</strong> to register a new one.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── STEP 1 · VISIT & HISTORY ─────────────────────── -->
      <div v-show="activeStep === 1">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-bold" style="color:#0d6efd">📋 Visit & History</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label fw-semibold">Visit Date & Time</label>
                <input v-model="visit.created_at" type="datetime-local" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Visit Type</label>
                <select v-model="visit.visit_type" class="form-select">
                  <option value="new">New Visit</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-Up</option>
                  <option value="emergency">Emergency</option>
                  <option value="online">Online Consultation</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Duration of Complaints</label>
                <input v-model="visit.duration_complaints" class="form-control" placeholder="e.g. 3 days, 1 week" />
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Chief Complaints <span class="text-danger">*</span></label>
                <textarea v-model="visit.chief_complaints"
                  class="form-control"
                  :class="{ 'is-invalid': errors.chief_complaints }"
                  rows="3" placeholder="Main presenting complaints…"
                  @blur="validate('chief_complaints')"></textarea>
                <div v-if="errors.chief_complaints" class="invalid-feedback">⚠ {{ errors.chief_complaints }}</div>
                <div class="form-text">Describe the patient's primary reason for this visit.</div>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">History of Present Illness</label>
                <textarea v-model="visit.hpi" class="form-control" rows="3" placeholder="Detailed description of the current illness…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Past Medical History</label>
                <textarea v-model="visit.past_medical_history" class="form-control" rows="3" placeholder="Diabetes, hypertension, past surgeries…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Family History</label>
                <textarea v-model="visit.family_history" class="form-control" rows="3" placeholder="Relevant family medical conditions…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Allergy History</label>
                <textarea v-model="visit.allergy_history" class="form-control" rows="2" placeholder="Drug / food allergies…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Current Medications</label>
                <textarea v-model="visit.current_medications" class="form-control" rows="2" placeholder="Medicines currently being taken…"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Lifestyle History</label>
                <input v-model="visit.lifestyle_history" class="form-control" placeholder="Smoking, alcohol, diet, exercise…" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── STEP 2 · EXAMINATION ──────────────────────────── -->
      <div v-show="activeStep === 2">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-bold" style="color:#0d6efd">🔬 Vitals</h6>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-2">
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">Pulse (bpm)</label>
                <input v-model="exam.pulse" class="form-control text-center" placeholder="80" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">BP (mmHg)</label>
                <input v-model="exam.bp" class="form-control text-center" placeholder="120/80" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">Temp (°F)</label>
                <input v-model="exam.temperature" class="form-control text-center" placeholder="98.6" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">SpO2 (%)</label>
                <input v-model="exam.spo2" class="form-control text-center" placeholder="99" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">RR (br/min)</label>
                <input v-model="exam.respiratory_rate" class="form-control text-center" placeholder="18" />
              </div>
            </div>
            <!-- Smart Height & Weight -->
            <height-weight-input
              :height-cm.sync="exam.height"
              :weight-kg.sync="exam.weight" />
          </div>
        </div>
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-bold" style="color:#0d6efd">🔬 Examination Findings</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label fw-semibold small">Symptoms / Presenting Complaints</label>
                <textarea v-model="exam.symptoms" class="form-control" rows="2" placeholder="Symptoms observed on examination…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">General Examination</label>
                <textarea v-model="exam.general_examination" class="form-control" rows="3" placeholder="Conscious, oriented, pallor, icterus, oedema…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Systemic Examination</label>
                <textarea v-model="exam.systemic_examination" class="form-control" rows="3" placeholder="CVS, RS, CNS, P/A findings…"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold small">Key Findings</label>
                <textarea v-model="exam.findings" class="form-control" rows="2" placeholder="Important clinical findings…"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── STEP 3 · INVESTIGATIONS ───────────────────────── -->
      <div v-show="activeStep === 3">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-0 fw-bold" style="color:#0d6efd">🧪 Investigations</h6>
              <p class="text-muted small mb-0 mt-1">Optional — add lab tests or imaging orders</p>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="addInvestigation">+ Add Row</button>
          </div>
          <div class="card-body">
            <!-- Quick-add chips -->
            <div class="d-flex flex-wrap gap-1 mb-3">
              <span class="text-muted small me-1 align-self-center">Quick add:</span>
              <button v-for="inv in quickInv" :key="inv"
                class="btn btn-sm"
                style="font-size:11px;padding:2px 10px;border-radius:16px;transition:all .15s"
                :class="investigations.some(i => i.name === inv) ? 'btn-success' : 'btn-outline-secondary'"
                @click="addQuickInv(inv)">
                {{ inv }}
              </button>
            </div>
            <div v-if="!investigations.length" class="text-center py-5">
              <div style="font-size:44px">🧪</div>
              <p class="text-muted small mt-2 mb-0">No investigations added yet.<br>Use quick-add chips or click "+ Add Row".</p>
            </div>
            <div v-for="(inv, i) in investigations" :key="i"
              class="border rounded-3 p-3 mb-2"
              style="background:#fafbff">
              <div class="row g-2 align-items-end">
                <div class="col-md-3">
                  <label class="form-label small mb-1">Investigation</label>
                  <input v-model="inv.name" class="form-control form-control-sm" placeholder="CBC, X-Ray…" />
                </div>
                <div class="col-md-3">
                  <label class="form-label small mb-1">Result / Value</label>
                  <input v-model="inv.result" class="form-control form-control-sm" placeholder="Normal / 110 mg/dL…" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small mb-1">Date</label>
                  <input v-model="inv.date" type="date" class="form-control form-control-sm" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small mb-1">Notes</label>
                  <input v-model="inv.notes" class="form-control form-control-sm" />
                </div>
                <div class="col-md-1 d-flex align-items-end">
                  <label class="btn btn-sm btn-outline-secondary w-100 mb-0" :title="inv.image ? 'Change image' : 'Attach report image'">
                    📷
                    <input type="file" accept="image/*" class="d-none"
                      @change="handleInvImage(i, $event)" />
                  </label>
                </div>
                <div class="col-md-1 d-flex align-items-end">
                  <button class="btn btn-sm btn-outline-danger w-100" @click="investigations.splice(i,1)">✕</button>
                </div>
              </div>
              <!-- Image preview -->
              <div v-if="inv.image" class="mt-2 d-flex align-items-center gap-2">
                <img :src="inv.image" alt="Report" style="max-height:80px;max-width:120px;border-radius:6px;border:1px solid #dee2e6;object-fit:cover;cursor:pointer"
                     @click="previewImage = inv.image" />
                <button class="btn btn-sm btn-outline-danger" @click="$set(investigations[i], 'image', null)">✕ Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── STEP 4 · DIAGNOSIS ────────────────────────────── -->
      <div v-show="activeStep === 4">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-bold" style="color:#0d6efd">🩺 Diagnosis</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Final Diagnosis <span class="text-danger">*</span></label>
                <textarea v-model="diag.final_diagnosis"
                  class="form-control"
                  :class="{ 'is-invalid': errors.diagnosis }"
                  rows="3" placeholder="Confirmed diagnosis…"
                  @blur="validate('diagnosis')"></textarea>
                <div v-if="errors.diagnosis" class="invalid-feedback">⚠ {{ errors.diagnosis }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Provisional Diagnosis</label>
                <textarea v-model="diag.provisional_diagnosis" class="form-control" rows="3" placeholder="Working / provisional diagnosis…"></textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">ICD-10 Code</label>
                <input v-model="diag.icd_code" class="form-control" placeholder="J06.9 (optional)" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Severity</label>
                <div class="d-flex gap-2 flex-wrap mt-1">
                  <button v-for="s in severities" :key="s.value"
                    class="btn btn-sm flex-grow-1"
                    :class="diag.severity === s.value ? s.btnClass : 'btn-outline-secondary'"
                    @click="diag.severity = s.value">
                    {{ s.label }}
                  </button>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Next Follow-Up</label>
                <input v-model="billing.next_followup" type="date" class="form-control" :min="today" />
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Diagnosis Notes</label>
                <textarea v-model="diag.notes" class="form-control" rows="2" placeholder="Additional notes on diagnosis…"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div v-if="diag.severity" class="alert d-flex align-items-center gap-2 py-2 px-3"
             style="font-size:13px;border-radius:8px"
             :class="{ 'alert-success': diag.severity==='mild', 'alert-warning': diag.severity==='moderate', 'alert-danger': diag.severity==='severe'||diag.severity==='critical' }">
          <span>{{ diag.severity === 'mild' ? '🟢' : diag.severity === 'moderate' ? '🟡' : '🔴' }}</span>
          <span>Severity: <strong class="text-uppercase">{{ diag.severity }}</strong>
            <span v-if="diag.severity === 'critical'"> — Urgent attention required</span>
          </span>
        </div>
      </div>

      <!-- ─── STEP 5 · TREATMENT ────────────────────────────── -->
      <div v-show="activeStep === 5">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-bold" style="color:#0d6efd">💉 Treatment Given</h6>
            <p class="text-muted small mb-0 mt-1">Optional — document in-clinic procedures and treatments</p>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Injection Given</label>
                <input v-model="treatment.injection_given" class="form-control" placeholder="Name, dose, route…" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Procedure Done</label>
                <input v-model="treatment.procedure_done" class="form-control" placeholder="Procedure name / details…" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold small">Dressing</label>
                <input v-model="treatment.dressing" class="form-control" placeholder="Type / area…" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold small">Nebulization</label>
                <input v-model="treatment.nebulization" class="form-control" placeholder="Drug + dose…" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold small">Physiotherapy</label>
                <input v-model="treatment.physiotherapy" class="form-control" placeholder="Type / sessions…" />
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold small">Surgery Notes</label>
                <textarea v-model="treatment.surgery_notes" class="form-control" rows="2"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Treatment Notes / Advice</label>
                <textarea v-model="treatment.treatment_notes" class="form-control" rows="3" placeholder="Diet, rest, activity restrictions, follow-up instructions…"></textarea>
              </div>
              <!-- Prescription / treatment images -->
              <div class="col-12">
                <label class="form-label fw-semibold">Prescription / Treatment Images
                  <span class="text-muted fw-normal small">(up to 5, max 2 MB each)</span>
                </label>
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <div v-for="(img, idx) in treatment.prescription_images" :key="idx"
                       class="position-relative" style="display:inline-block">
                    <img :src="img" alt="Rx image"
                         style="height:80px;width:80px;object-fit:cover;border-radius:8px;border:1px solid #dee2e6;cursor:pointer"
                         @click="previewImage = img" />
                    <button class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                            style="width:20px;height:20px;font-size:10px;line-height:1;border-radius:50%;transform:translate(40%,-40%)"
                            @click="treatment.prescription_images.splice(idx,1)">✕</button>
                  </div>
                  <label v-if="treatment.prescription_images.length < 5"
                         class="d-flex align-items-center justify-content-center border rounded"
                         style="height:80px;width:80px;cursor:pointer;color:#6c757d;background:#f8f9fa;font-size:24px"
                         title="Add image">
                    +
                    <input type="file" accept="image/*" multiple class="d-none"
                           @change="handleTreatmentImages($event)" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Image lightbox -->
      <div v-if="previewImage" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
           style="background:rgba(0,0,0,.75);z-index:2000" @click="previewImage = null">
        <img :src="previewImage" alt="Preview" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,.5)" />
      </div>

      <!-- ─── STEP 6 · PRESCRIPTION ─────────────────────────── -->
      <div v-show="activeStep === 6">
        <!-- Builder -->
        <div class="card shadow-sm border-0 mb-3 d-print-none">
          <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-0 fw-bold" style="color:#0d6efd">💊 Prescription Builder</h6>
              <p class="text-muted small mb-0 mt-1">Add medicines with dose, frequency and timing</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="addTemplate">⚡ Quick Rx</button>
              <button class="btn btn-sm btn-outline-primary" @click="addMedicine">+ Medicine</button>
            </div>
          </div>
          <div class="card-body" :class="{ 'pb-1': medicines.length }">
            <div v-if="!medicines.length" class="text-center py-5">
              <div style="font-size:44px">💊</div>
              <p class="text-muted small mt-2 mb-0">No medicines yet.<br>Click <strong>+ Medicine</strong> to add one, or use <strong>⚡ Quick Rx</strong> for a common template.</p>
            </div>
            <div v-for="(med, i) in medicines" :key="i"
              class="border rounded-3 mb-3 overflow-hidden"
              style="border-color:#d0dbff !important">
              <!-- Medicine header -->
              <div class="d-flex align-items-center px-3 py-2 border-bottom" style="background:#f0f4ff">
                <span class="fw-bold text-primary me-2" style="font-size:12px">Rx {{ i + 1 }}</span>
                <span class="text-muted" style="font-size:12px">{{ med.name || 'New medicine' }}</span>
                <div class="ms-auto d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:11px"
                          @click="duplicateMedicine(i)" title="Duplicate row">⊕ Copy</button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-2" style="font-size:11px"
                          @click="medicines.splice(i,1)">✕ Remove</button>
                </div>
              </div>
              <!-- Fields -->
              <div class="p-3">
                <div class="row g-2 align-items-end mb-2">
                  <div class="col-12 col-md-3">
                    <label class="form-label small mb-1 fw-semibold">Medicine Name</label>
                    <input v-model="med.name" class="form-control form-control-sm" placeholder="e.g. Paracetamol" />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label small mb-1">Strength</label>
                    <input v-model="med.strength" class="form-control form-control-sm" placeholder="500mg" />
                  </div>
                  <div class="col-6 col-md-1">
                    <label class="form-label small mb-1">Dose</label>
                    <input v-model="med.dosage" class="form-control form-control-sm" placeholder="1 tab" />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label small mb-1">Frequency</label>
                    <select v-model="med.frequency" class="form-select form-select-sm">
                      <option value="OD">OD – Once/day</option>
                      <option value="BD">BD – Twice/day</option>
                      <option value="TDS">TDS – Thrice/day</option>
                      <option value="QID">QID – 4×/day</option>
                      <option value="SOS">SOS – As needed</option>
                      <option value="HS">HS – Bedtime</option>
                      <option value="Stat">Stat – Now</option>
                    </select>
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label small mb-1">Duration</label>
                    <input v-model="med.duration" class="form-control form-control-sm" placeholder="5 days" />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label small mb-1">Food</label>
                    <select v-model="med.food" class="form-select form-select-sm">
                      <option>After Food</option>
                      <option>Before Food</option>
                      <option>With Food</option>
                      <option>Empty Stomach</option>
                    </select>
                  </div>
                </div>
                <!-- Timing -->
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <span class="text-muted fw-semibold" style="font-size:12px;min-width:38px">Time:</span>
                  <template v-for="ti in (freqCounts[med.frequency] || 1)">
                    <select :key="'t'+i+'-'+ti"
                      class="form-select form-select-sm"
                      style="width:115px"
                      v-model="med.timing[ti-1]">
                      <option value="">— select —</option>
                      <option v-for="opt in timingOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <span v-if="ti < (freqCounts[med.frequency] || 1)" class="text-muted">·</span>
                  </template>
                  <input v-model="med.notes"
                    class="form-control form-control-sm"
                    style="min-width:100px;max-width:220px"
                    placeholder="Extra instructions…" />
                </div>
              </div>
              <!-- Summary badge -->
              <div v-if="med.name" class="px-3 py-2 border-top" style="background:#f8f9ff;font-size:12px">
                <span class="fw-semibold text-primary">{{ med.name }}</span>
                <span v-if="med.strength" class="text-muted ms-1">{{ med.strength }}</span>
                <span class="badge bg-primary ms-2" style="font-size:10px">{{ med.frequency }}</span>
                <span v-if="med.food" class="text-muted ms-2">· {{ med.food }}</span>
                <span v-if="timingStr(med)" class="text-muted ms-1">@ {{ timingStr(med) }}</span>
                <span v-if="med.duration" class="text-muted ms-2">· {{ med.duration }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Printable prescription -->
        <div class="card shadow-sm border-0 mb-3" id="printable-rx">
          <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center d-print-block">
            <h6 class="mb-0 fw-bold d-print-none">🖨 Prescription Preview</h6>
            <button class="btn btn-sm btn-outline-secondary d-print-none" @click="printPrescription">🖨 Print</button>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="fw-bold mb-0">Dr. {{ doctorName }}</h5>
                <div class="text-muted small">{{ doctorDegree }}</div>
              </div>
              <div class="text-end text-muted small">
                <div>Date: {{ formatDate(visit.created_at) }}</div>
                <div v-if="billing.next_followup">Follow-up: {{ formatDate(billing.next_followup) }}</div>
              </div>
            </div>
            <hr class="my-2">
            <div class="mb-1" style="font-size:14px">
              <strong>Patient:</strong> {{ patient.full_name || '—' }}
              <span class="ms-3 text-muted" v-if="patient.age">{{ patient.age }}y</span>
              <span class="ms-1 text-muted" v-if="patient.sex">{{ patient.sex }}</span>
              <span class="ms-3 text-muted" v-if="patient.phone">📞 {{ patient.phone }}</span>
            </div>
            <div v-if="diag.final_diagnosis || diag.provisional_diagnosis" class="mb-2" style="font-size:14px">
              <strong>Dx:</strong> {{ diag.final_diagnosis || diag.provisional_diagnosis }}
              <span v-if="diag.severity" class="ms-2 badge"
                :class="{'bg-warning text-dark':diag.severity==='moderate','bg-danger':diag.severity==='severe'||diag.severity==='critical','bg-success':diag.severity==='mild'}">
                {{ diag.severity }}
              </span>
            </div>
            <div class="fw-bold mb-2" style="font-size:22px;font-family:serif">℞</div>
            <div v-if="medicines.length">
              <table class="table table-sm table-bordered" style="font-size:13px">
                <thead class="table-light">
                  <tr><th style="width:28px">#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in medicines" :key="i">
                    <td>{{ i+1 }}</td>
                    <td class="fw-semibold">{{ m.name }} <span class="fw-normal text-muted">{{ m.strength }}</span></td>
                    <td>{{ m.dosage }}</td>
                    <td>{{ m.frequency }}</td>
                    <td>{{ m.duration }}</td>
                    <td>{{ m.food }}<span v-if="timingStr(m)"> · {{ timingStr(m) }}</span><span v-if="m.notes"> · {{ m.notes }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted small fst-italic mb-2">No medicines prescribed.</div>
            <div v-if="treatment.treatment_notes" class="mt-1" style="font-size:13px">
              <strong>Advice:</strong> {{ treatment.treatment_notes }}
            </div>
          </div>
        </div>
      </div>

      <!-- ─── STEP 7 · BILLING ───────────────────────────────── -->
      <div v-show="activeStep === 7">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-bold" style="color:#0d6efd">💰 Billing & Payment</h6>
            <p class="text-muted small mb-0 mt-1">Set consultation fee and record payment status</p>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label fw-semibold">Consultation Fee (₹) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text fw-bold">₹</span>
                  <input v-model.number="billing.charges"
                    type="number" min="0"
                    class="form-control fw-bold fs-5"
                    :class="{ 'is-invalid': errors.charges }"
                    @blur="validate('charges')" />
                </div>
                <div v-if="errors.charges" class="text-danger small mt-1">⚠ {{ errors.charges }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Payment Status</label>
                <div class="d-flex gap-2 mt-1">
                  <button v-for="ps in paymentStatuses" :key="ps.value"
                    class="btn btn-sm flex-grow-1 fw-semibold"
                    :class="billing.payment_status === ps.value ? ps.btnClass : 'btn-outline-secondary'"
                    @click="billing.payment_status = ps.value">
                    {{ ps.icon }} {{ ps.label }}
                  </button>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Payment Method</label>
                <div class="d-flex gap-2 mt-1">
                  <button v-for="pm in paymentMethods" :key="pm.value"
                    class="btn btn-sm flex-grow-1 fw-semibold"
                    :class="billing.payment_method === pm.value ? pm.btnClass : 'btn-outline-secondary'"
                    @click="billing.payment_method = pm.value">
                    {{ pm.icon }} {{ pm.label }}
                  </button>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Next Follow-Up</label>
                <input v-model="billing.next_followup" type="date" class="form-control" :min="today" />
              </div>
              <!-- Partial payment amount — only shown when Partial is selected -->
              <div v-if="billing.payment_status === 'partial'" class="col-md-4">
                <label class="form-label fw-semibold">Amount Paid (₹)</label>
                <div class="input-group">
                  <span class="input-group-text">₹</span>
                  <input v-model.number="billing.amount_paid"
                    type="number" min="0" :max="billing.charges"
                    class="form-control"
                    placeholder="Amount received so far" />
                </div>
                <div class="form-text text-danger fw-semibold" v-if="billing.amount_paid !== null && billing.amount_paid >= 0">
                  ₹ {{ (billing.charges || 0) - (billing.amount_paid || 0) }} still unpaid
                </div>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Internal Notes</label>
                <input v-model="billing.notes" class="form-control" placeholder="Notes visible only to you…" />
              </div>
            </div>

            <!-- Billing summary -->
            <div class="mt-4 p-4 rounded-3" style="background:linear-gradient(135deg,#f0f4ff,#e8f5e9);border:1px solid #d0dbff">
              <div class="fw-bold mb-3 text-primary" style="font-size:15px">💰 Billing Summary</div>
              <div class="d-flex justify-content-between py-2 border-bottom" style="font-size:14px">
                <span class="text-muted">Consultation Fee</span>
                <span class="fw-bold">₹ {{ billing.charges || 0 }}</span>
              </div>
              <template v-if="billing.payment_status === 'partial'">
                <div class="d-flex justify-content-between py-2 border-bottom" style="font-size:14px">
                  <span class="text-muted">Amount Paid</span>
                  <span class="fw-bold text-success">₹ {{ billing.amount_paid || 0 }}</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom" style="font-size:14px">
                  <span class="text-muted">Amount Unpaid</span>
                  <span class="fw-bold text-danger">₹ {{ (billing.charges || 0) - (billing.amount_paid || 0) }}</span>
                </div>
              </template>
              <div class="d-flex justify-content-between py-2 border-bottom" style="font-size:14px">
                <span class="text-muted">Payment Method</span>
                <span class="text-capitalize fw-semibold">
                  {{ {cash:'💵 Cash', upi:'📱 UPI', netbanking:'🏦 NetBanking', other:'🔖 Other'}[billing.payment_method] || '💵 Cash' }}
                </span>
              </div>
              <div class="d-flex justify-content-between py-2 border-bottom" style="font-size:14px">
                <span class="text-muted">Visit Type</span>
                <span class="text-capitalize">{{ (visit.visit_type || 'consultation').replace('_', ' ') }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center pt-3" style="font-size:17px">
                <span class="fw-bold">Total</span>
                <span class="fw-bold text-success" style="font-size:22px">₹ {{ billing.charges || 0 }}</span>
              </div>
              <div class="mt-3">
                <span class="badge px-3 py-2 fs-6"
                  :class="billing.payment_status==='paid' ? 'bg-success' : billing.payment_status==='partial' ? 'bg-warning text-dark' : 'bg-danger'">
                  {{ billing.payment_status==='paid' ? '✅ Fully Paid' : billing.payment_status==='partial' ? '⚠️ Partial Payment' : '❌ Unpaid' }}
                </span>
                <span v-if="billing.payment_status === 'partial' && billing.amount_paid !== null"
                      class="ms-2 badge bg-danger px-3 py-2 fs-6">
                  ₹ {{ (billing.charges || 0) - (billing.amount_paid || 0) }} pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── NAVIGATION BAR ─────────────────────────────────── -->
      <div class="card shadow-sm border-0 mb-4 d-print-none"
           style="position:sticky;bottom:12px;z-index:100">
        <div class="card-body d-flex justify-content-between align-items-center py-3 flex-wrap gap-2">
          <!-- Back -->
          <button v-if="activeStep > 0"
            class="btn btn-outline-secondary px-4"
            @click="prevStep">
            ← Back
          </button>
          <div v-else></div>

          <!-- Error summary inline -->
          <div v-if="saveError" class="text-danger d-flex align-items-center gap-1 small fw-semibold flex-grow-1 justify-content-center">
            <span>⚠</span> <span>{{ saveError }}</span>
          </div>

          <!-- Next / Save -->
          <div class="d-flex gap-2 align-items-center">
            <button v-if="activeStep < steps.length - 1"
              class="btn btn-primary px-4"
              @click="nextStep">
              Next: {{ steps[activeStep + 1].label }} →
            </button>
            <button v-else
              class="btn btn-success px-4 fw-semibold"
              @click="isEdit ? triggerSave() : openReview()"
              :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" style="width:14px;height:14px"></span>
              {{ isEdit ? '✓ Update Casepaper' : '✓ Review & Save' }}
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══════════════════ REVIEW MODAL ═══════════════════ -->
    <div v-if="showReview"
         class="modal fade show d-block"
         tabindex="-1"
         style="background:rgba(0,0,0,.55);z-index:1055"
         @click.self="showReview = false">
      <div class="modal-dialog modal-lg modal-dialog-scrollable" style="margin:24px auto">
        <div class="modal-content border-0 shadow-lg" style="border-radius:16px;overflow:hidden">
          <div class="modal-header border-0 pb-2 pt-4 px-4">
            <div>
              <h5 class="modal-title fw-bold mb-0">📋 Review Before Saving</h5>
              <p class="text-muted small mb-0 mt-1">Please confirm all details are correct before saving.</p>
            </div>
            <button type="button" class="btn-close" @click="showReview = false"></button>
          </div>
          <div class="modal-body px-4 py-0">

            <!-- Warnings -->
            <div v-if="reviewWarnings.length" class="alert alert-warning py-2 px-3 mb-3" style="border-radius:10px;font-size:13px">
              <div class="fw-semibold mb-1">⚠️ Please review:</div>
              <ul class="mb-0 ps-3">
                <li v-for="w in reviewWarnings" :key="w">{{ w }}</li>
              </ul>
            </div>

            <!-- Patient -->
            <div class="p-3 rounded-3 mb-3" style="background:#f8f9ff;border:1px solid #e0e8ff">
              <div class="text-muted small fw-semibold text-uppercase mb-2" style="letter-spacing:.8px;font-size:10px">👤 Patient</div>
              <div class="fw-bold" style="font-size:16px">{{ patient.full_name || '—' }}</div>
              <div class="text-muted small mt-1">
                {{ [patient.age ? patient.age+'y' : '', patient.sex, patient.phone, patient.pincode].filter(Boolean).join(' · ') || 'No details provided' }}
              </div>
            </div>

            <!-- Visit + Diagnosis -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <div class="p-3 rounded-3 h-100" style="background:#f8f9ff;border:1px solid #e0e8ff">
                  <div class="text-muted small fw-semibold text-uppercase mb-2" style="letter-spacing:.8px;font-size:10px">📋 Visit</div>
                  <div class="small">
                    <div><span class="text-muted">Type:</span> <strong class="text-capitalize">{{ (visit.visit_type||'consultation').replace('_',' ') }}</strong></div>
                    <div><span class="text-muted">Date:</span> {{ formatDate(visit.created_at) }}</div>
                    <div v-if="visit.chief_complaints" class="mt-1">
                      <span class="text-muted">Complaints:</span> {{ visit.chief_complaints.slice(0,80) }}{{ visit.chief_complaints.length>80 ? '…' : '' }}
                    </div>
                    <div v-else class="text-warning mt-1">⚠ No chief complaints entered</div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 rounded-3 h-100" style="background:#f8f9ff;border:1px solid #e0e8ff">
                  <div class="text-muted small fw-semibold text-uppercase mb-2" style="letter-spacing:.8px;font-size:10px">🩺 Diagnosis</div>
                  <div v-if="diag.final_diagnosis || diag.provisional_diagnosis">
                    <div class="fw-semibold" style="font-size:14px">{{ diag.final_diagnosis || diag.provisional_diagnosis }}</div>
                    <span v-if="diag.severity" class="badge mt-1"
                      :class="{'bg-success':diag.severity==='mild','bg-warning text-dark':diag.severity==='moderate','bg-danger':['severe','critical'].includes(diag.severity)}">
                      {{ diag.severity }}
                    </span>
                  </div>
                  <div v-else class="text-warning small">⚠ No diagnosis entered</div>
                </div>
              </div>
            </div>

            <!-- Prescription -->
            <div class="p-3 rounded-3 mb-3" style="background:#f8f9ff;border:1px solid #e0e8ff">
              <div class="text-muted small fw-semibold text-uppercase mb-2" style="letter-spacing:.8px;font-size:10px">
                💊 Prescription — {{ medicines.length }} medicine{{ medicines.length !== 1 ? 's' : '' }}
              </div>
              <div v-if="medicines.length">
                <div v-for="(m, i) in medicines" :key="i"
                  class="d-flex align-items-center gap-2 py-1 border-bottom" style="font-size:13px">
                  <span class="text-muted" style="min-width:16px">{{ i+1 }}.</span>
                  <span class="fw-semibold">{{ m.name }}</span>
                  <span v-if="m.strength" class="text-muted">{{ m.strength }}</span>
                  <span class="badge bg-primary" style="font-size:10px">{{ m.frequency }}</span>
                  <span v-if="m.duration" class="text-muted small">{{ m.duration }}</span>
                  <span v-if="m.food" class="text-muted small">· {{ m.food }}</span>
                </div>
              </div>
              <div v-else class="text-muted small fst-italic">No medicines prescribed.</div>
            </div>

            <!-- Billing -->
            <div class="p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center" style="background:#f0fff4;border:1px solid #b2dfdb">
              <div>
                <div class="text-muted small fw-semibold text-uppercase mb-1" style="letter-spacing:.8px;font-size:10px">💰 Billing</div>
                <span class="badge px-2 py-1 fs-6"
                  :class="billing.payment_status==='paid' ? 'bg-success' : billing.payment_status==='partial' ? 'bg-warning text-dark' : 'bg-danger'">
                  {{ billing.payment_status==='paid' ? '✅ Paid' : billing.payment_status==='partial' ? '⚠️ Partial' : '❌ Unpaid' }}
                </span>
                <div v-if="billing.next_followup" class="text-muted small mt-1">Follow-up: {{ formatDate(billing.next_followup) }}</div>
              </div>
              <div class="text-end">
                <div class="text-muted small">Total</div>
                <div class="fw-bold text-success" style="font-size:24px">₹ {{ billing.charges }}</div>
              </div>
            </div>

          </div>
          <div class="modal-footer border-0 px-4 pb-4 pt-2 d-flex gap-2">
            <button class="btn btn-outline-secondary" @click="showReview = false">✏️ Edit Details</button>
            <button class="btn btn-success flex-grow-1 fw-semibold" @click="confirmSave" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" style="width:14px;height:14px"></span>
              {{ saving ? 'Saving…' : '✅ Confirm & Save Casepaper' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Print prescription area -->
    <div id="print-only-rx" style="display:none" class="d-print-block"></div>

  </div>
  `,

  directives: {
    clickOutside: {
      bind(el, binding) {
        el._clickOutside = e => { if (!el.contains(e.target)) binding.value(); };
        document.addEventListener("mousedown", el._clickOutside);
      },
      unbind(el) {
        document.removeEventListener("mousedown", el._clickOutside);
      }
    }
  },

  data() {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    return {
      token:       localStorage.getItem("auth-token"),
      doctorName:  localStorage.getItem("full_name") || "Doctor",
      doctorDegree:"",
      today:       now.toISOString().split("T")[0],
      saving:       false,
      saveError:    null,
      activeStep:   0,
      showReview:   false,
      autosaveLabel: "",
      previewImage: null,

      // Patient autocomplete
      patientQuery:    "",
      patientResults:  [],
      searchTimer:     null,
      dropdownOpen:    false,
      hoveredPatient:  null,
      showPatientForm: false,

      // Inline validation errors
      errors: {
        full_name:        "",
        phone:            "",
        chief_complaints: "",
        diagnosis:        "",
        charges:          ""
      },

      // Patient
      patient: {
        id: null, full_name: "", dob: "", age: null, sex: "", weight: null,
        height: null, blood_group: "", phone: "", address: "", pincode: "",
        emergency_contact: ""
      },

      // Visit
      visit: {
        created_at: localNow, visit_type: "new", duration_complaints: "",
        chief_complaints: "", hpi: "", past_medical_history: "",
        family_history: "", allergy_history: "", current_medications: "",
        lifestyle_history: ""
      },

      // Examination
      exam: {
        pulse: "", bp: "", temperature: "", spo2: "", respiratory_rate: "",
        weight: null, height: null,
        symptoms: "", general_examination: "", systemic_examination: "", findings: ""
      },

      investigations: [],
      medicines:      [],

      diag: {
        provisional_diagnosis: "", final_diagnosis: "", icd_code: "",
        severity: "", notes: ""
      },

      treatment: {
        injection_given: "", procedure_done: "", dressing: "",
        nebulization: "", physiotherapy: "", surgery_notes: "", treatment_notes: "",
        prescription_images: []
      },

      billing: {
        charges: 150, amount_paid: null, payment_status: "paid", payment_method: "cash", next_followup: "", notes: ""
      },

      steps: [
        { label: "Patient",       icon: "👤" },
        { label: "History",       icon: "📋" },
        { label: "Examination",   icon: "🔬" },
        { label: "Investigations",icon: "🧪" },
        { label: "Diagnosis",     icon: "🩺" },
        { label: "Treatment",     icon: "💉" },
        { label: "Prescription",  icon: "💊" },
        { label: "Billing",       icon: "💰" }
      ],

      severities: [
        { value: "mild",     label: "Mild",     btnClass: "btn-success" },
        { value: "moderate", label: "Moderate", btnClass: "btn-warning" },
        { value: "severe",   label: "Severe",   btnClass: "btn-danger"  },
        { value: "critical", label: "Critical", btnClass: "btn-danger"  }
      ],

      paymentStatuses: [
        { value: "paid",    label: "Paid",    icon: "✅", btnClass: "btn-success" },
        { value: "partial", label: "Partial", icon: "⚠️", btnClass: "btn-warning" },
        { value: "unpaid",  label: "Unpaid",  icon: "❌", btnClass: "btn-danger"  }
      ],
      paymentMethods: [
        { value: "cash",       label: "Cash",       icon: "💵", btnClass: "btn-success"   },
        { value: "upi",        label: "UPI",        icon: "📱", btnClass: "btn-primary"   },
        { value: "netbanking", label: "NetBanking", icon: "🏦", btnClass: "btn-info text-white" },
        { value: "other",      label: "Other",      icon: "🔖", btnClass: "btn-secondary" }
      ],

      bloodGroups: ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"],

      quickInv: [
        "CBC", "LFT", "KFT", "Blood Sugar (F)", "Blood Sugar (PP)", "HbA1c",
        "Urine R/M", "X-Ray Chest", "ECG", "Lipid Profile", "Thyroid (TSH)",
        "USG Abdomen", "MRI Brain", "CT Scan", "Sputum AFB", "Dengue NS1"
      ],

      freqCounts: { OD: 1, BD: 2, TDS: 3, QID: 4, SOS: 1, HS: 1, Stat: 1 },

      timingOptions: [
        "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
        "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
        "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM","11:00 PM","12:00 AM"
      ]
    };
  },

  computed: {
    isEdit() { return !!this.$route.params.id; },

    bmi() {
      const w = parseFloat(this.exam.weight) || parseFloat(this.patient.weight);
      const h = parseFloat(this.exam.height) || parseFloat(this.patient.height);
      if (w > 0 && h > 0) return (w / ((h / 100) ** 2)).toFixed(1);
      return null;
    },

    bmiCategory() {
      const b = parseFloat(this.bmi);
      if (!b) return "";
      if (b < 18.5) return "Underweight";
      if (b < 25)   return "Normal weight";
      if (b < 30)   return "Overweight";
      return "Obese";
    },

    bmiAlert() {
      const b = parseFloat(this.bmi);
      if (!b) return "alert-secondary";
      if (b < 18.5) return "alert-warning";
      if (b < 25)   return "alert-success";
      if (b < 30)   return "alert-warning";
      return "alert-danger";
    },

    progressPct() {
      const done = this.steps.filter((_, i) => this.stepDone(i)).length;
      return Math.round((done / this.steps.length) * 100);
    },

    reviewWarnings() {
      const w = [];
      if (!this.visit.chief_complaints.trim()) w.push("No chief complaints entered.");
      if (!this.diag.final_diagnosis.trim() && !this.diag.provisional_diagnosis.trim())
        w.push("No diagnosis entered.");
      if (!this.medicines.length) w.push("No medicines prescribed.");
      return w;
    }
  },

  methods: {
    // ─── Step completion checks ────────────────────────────────
    stepDone(i) {
      switch (i) {
        case 0: return !!this.patient.full_name.trim() && this.showPatientForm;
        case 1: return !!(this.visit.chief_complaints || this.visit.hpi);
        case 2: return !!(this.exam.pulse || this.exam.bp || this.exam.temperature || this.exam.spo2);
        case 3: return this.investigations.length > 0;
        case 4: return !!(this.diag.final_diagnosis || this.diag.provisional_diagnosis);
        case 5: return !!(this.treatment.treatment_notes || this.treatment.injection_given || this.treatment.procedure_done);
        case 6: return this.medicines.length > 0;
        case 7: return this.billing.charges >= 0;
        default: return false;
      }
    },

    stepHasError(i) {
      switch (i) {
        case 0: return !!(this.errors.full_name || this.errors.phone);
        case 1: return !!this.errors.chief_complaints;
        case 4: return !!this.errors.diagnosis;
        case 7: return !!this.errors.charges;
        default: return false;
      }
    },

    circleStyle(i) {
      if (this.stepHasError(i))                              return { background: "#dc3545", borderColor: "#dc3545", color: "white" };
      if (this.activeStep === i)                             return { background: "#0d6efd", borderColor: "#0d6efd", color: "white" };
      if (this.stepDone(i))                                 return { background: "#198754", borderColor: "#198754", color: "white" };
      return { background: "white", borderColor: "#dee2e6", color: "#6c757d" };
    },

    labelStyle(i) {
      if (this.stepHasError(i))  return { color: "#dc3545", fontWeight: "600" };
      if (this.activeStep === i) return { color: "#0d6efd", fontWeight: "600" };
      if (this.stepDone(i))      return { color: "#198754" };
      return { color: "#9ca3af" };
    },

    // ─── Navigation ───────────────────────────────────────────
    goToStep(i) {
      this.activeStep = i;
      this.saveError  = null;
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    nextStep() {
      if (!this.validateStep(this.activeStep)) {
        this.saveError = this.stepErrorMessage(this.activeStep);
        return;
      }
      this.saveError = null;
      if (this.activeStep < this.steps.length - 1) {
        this.activeStep++;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    prevStep() {
      if (this.activeStep > 0) {
        this.activeStep--;
        this.saveError = null;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    // ─── Validation ───────────────────────────────────────────
    validate(field) {
      switch (field) {
        case "full_name":
          this.errors.full_name = this.patient.full_name.trim()
            ? "" : "Patient name is required.";
          break;
        case "phone":
          if (this.patient.phone && !/^\d{10}$/.test(this.patient.phone.replace(/\s/g, ""))) {
            this.errors.phone = "Phone number must be exactly 10 digits.";
          } else {
            this.errors.phone = "";
          }
          break;
        case "chief_complaints":
          this.errors.chief_complaints = this.visit.chief_complaints.trim()
            ? "" : "Please enter at least one chief complaint.";
          break;
        case "diagnosis":
          this.errors.diagnosis = (this.diag.final_diagnosis.trim() || this.diag.provisional_diagnosis.trim())
            ? "" : "Please enter at least a provisional diagnosis.";
          break;
        case "charges":
          this.errors.charges = (this.billing.charges >= 0 && !isNaN(this.billing.charges))
            ? "" : "Consultation fee must be a valid number (0 or more).";
          break;
      }
    },

    validateStep(i) {
      switch (i) {
        case 0:
          if (!this.showPatientForm) {
            this.errors.full_name = "Please select or create a patient to continue.";
          } else {
            this.validate("full_name");
          }
          this.validate("phone");
          return !this.errors.full_name && !this.errors.phone;
        case 1:
          // chief complaints recommended, not blocking for next
          return true;
        case 7:
          this.validate("charges");
          return !this.errors.charges;
        default:
          return true;
      }
    },

    validateAll() {
      if (!this.showPatientForm) {
        this.errors.full_name = "Please select or create a patient before saving.";
      } else {
        this.validate("full_name");
      }
      this.validate("phone");
      this.validate("charges");
      return !this.errors.full_name && !this.errors.phone && !this.errors.charges;
    },

    stepErrorMessage(i) {
      switch (i) {
        case 0: return this.errors.full_name || this.errors.phone || "Please complete Patient Details first.";
        case 7: return this.errors.charges || "Please enter a valid consultation fee.";
        default: return null;
      }
    },

    // ─── Review & Save flow ───────────────────────────────────
    openReview() {
      if (!this.validateAll()) {
        if (this.errors.full_name || this.errors.phone) {
          this.activeStep = 0;
          this.saveError  = this.errors.full_name || this.errors.phone;
        } else if (this.errors.charges) {
          this.activeStep = 7;
          this.saveError  = this.errors.charges;
        }
        return;
      }
      this.saveError  = null;
      this.showReview = true;
    },

    async confirmSave() {
      await this.save();
    },

    async triggerSave() {
      await this.save();
    },

    async save() {
      this.saveError = null;
      this.saving    = true;
      try {
        // 1. Create or reuse patient
        let patientId = this.patient.id;
        if (!patientId) {
          const pr = await fetch("/api/patients", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
            body: JSON.stringify({
              full_name:         this.patient.full_name.trim(),
              dob:               this.patient.dob        || null,
              age:               this.patient.age        || null,
              sex:               this.patient.sex        || null,
              weight:            this.patient.weight     || null,
              height:            this.patient.height     || null,
              blood_group:       this.patient.blood_group|| null,
              phone:             this.patient.phone      || null,
              address:           this.patient.address    || "",
              pincode:           this.patient.pincode    || "",
              emergency_contact: this.patient.emergency_contact || null
            })
          });
          const pd = await pr.json();
          if (!pr.ok) {
            const msg = pd.error || "Failed to create patient.";
            if (msg.toLowerCase().includes("phone")) {
              this.errors.phone = "This phone number is already registered to another patient.";
              this.activeStep   = 0;
            }
            this.saveError  = msg;
            this.showReview = false;
            return;
          }
          patientId = pd.id;
        }

        // 2. Build summary strings
        const symptomsSummary    = this.exam.symptoms || this.visit.chief_complaints || "";
        const diagnosisSummary   = this.diag.final_diagnosis || this.diag.provisional_diagnosis || "";
        const prescriptionSummary = this.medicines.length
          ? this.medicines.map(m => `${m.name}${m.strength ? " "+m.strength : ""} ${m.frequency}`).join(", ")
          : "";

        // 3. POST / PUT casepaper
        const payload = {
          patient_id:      patientId,
          created_at:      this.visit.created_at,
          visit_type:      this.visit.visit_type,
          symptoms:        symptomsSummary,
          diagnosis:       diagnosisSummary,
          prescription:    prescriptionSummary,
          charges:         this.billing.charges,
          amount_paid:     this.billing.payment_status === "partial" ? (this.billing.amount_paid ?? null) : null,
          payment_status:  this.billing.payment_status,
          payment_method:  this.billing.payment_method || "cash",
          notes:           this.billing.notes,
          next_followup:   this.billing.next_followup || null,
          visit_info:       { ...this.visit },
          vitals:           { ...this.exam, bmi: this.bmi,
                               weight: this.exam.weight || this.patient.weight,
                               height: this.exam.height || this.patient.height },
          examination:      { symptoms: this.exam.symptoms,
                               general_examination:  this.exam.general_examination,
                               systemic_examination: this.exam.systemic_examination,
                               findings:             this.exam.findings },
          diagnosis_detail: { ...this.diag },
          treatment_detail: { ...this.treatment },
          medicines:        this.medicines,
          investigations:   this.investigations
        };

        const url    = this.isEdit ? `/api/casepaper/${this.$route.params.id}` : "/api/casepaper";
        const method = this.isEdit ? "PUT" : "POST";

        const res  = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
          this.showReview = false;
          this.clearDraft();
          if (this.isEdit) {
            this.$toast && this.$toast("Casepaper updated successfully!", "success");
            this.$router.push("/casepapers");
          } else {
            this.$toast && this.$toast("Casepaper saved successfully!", "success");
            this.resetForm();
          }
        } else {
          const errMsg = data.error || "Save failed. Please try again.";
          this.saveError = errMsg;
          if (errMsg.toLowerCase().includes("session") || errMsg.toLowerCase().includes("auth")) {
            this.saveError = "Session expired. Please log in again.";
          } else if (errMsg.toLowerCase().includes("network") || res.status >= 500) {
            this.saveError = "Server error. Please retry in a moment.";
          }
        }
      } catch (err) {
        console.error("Save error:", err);
        this.saveError  = "Network connection lost. Please check your internet and retry.";
        this.showReview = false;
      } finally {
        this.saving = false;
      }
    },

    // ─── Patient search / selection ────────────────────────────
    onPatientSearch() {
      clearTimeout(this.searchTimer);
      if (this.patientQuery.length < 2) { this.patientResults = []; return; }
      this.searchTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/patient/search?query=${encodeURIComponent(this.patientQuery)}`, {
            headers: { "Authentication-Token": this.token }
          });
          this.patientResults = res.ok ? await res.json() : [];
          this.dropdownOpen   = true;
        } catch { this.patientResults = []; }
      }, 280);
    },

    selectPatient(p) {
      this.patient = {
        id:                p.id,
        full_name:         p.full_name         || "",
        dob:               p.dob               || "",
        age:               p.age               || null,
        sex:               p.sex               || "",
        weight:            p.weight            || null,
        height:            p.height            || null,
        blood_group:       p.blood_group       || "",
        phone:             p.phone             || "",
        address:           p.address           || "",
        pincode:           p.pincode           || "",
        emergency_contact: p.emergency_contact || ""
      };
      this.patientQuery    = p.full_name;
      this.showPatientForm = true;
      this.dropdownOpen    = false;
      this.errors.full_name = "";
    },

    useNewPatient() {
      this.patient.id        = null;
      this.patient.full_name = this.patientQuery;
      this.showPatientForm   = true;
      this.dropdownOpen      = false;
    },

    clearPatient() {
      this.patient = {
        id: null, full_name: "", dob: "", age: null, sex: "", weight: null,
        height: null, blood_group: "", phone: "", address: "", pincode: "", emergency_contact: ""
      };
      this.patientQuery    = "";
      this.showPatientForm = false;
    },

    closeDropdown() { this.dropdownOpen = false; },

    calcAge() {
      if (!this.patient.dob) return;
      const dob   = new Date(this.patient.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (today.getMonth() < dob.getMonth() ||
         (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
      this.patient.age = age >= 0 ? age : null;
    },

    // ─── Investigations ────────────────────────────────────────
    addInvestigation() {
      this.investigations.push({ name: "", result: "", date: "", notes: "", image: null });
    },
    addQuickInv(name) {
      if (this.investigations.some(i => i.name === name)) return;
      this.investigations.push({ name, result: "", date: "", notes: "", image: null });
    },

    handleInvImage(idx, evt) {
      const file = evt.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        this.$toast && this.$toast("Image must be under 2 MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = e => this.$set(this.investigations[idx], "image", e.target.result);
      reader.readAsDataURL(file);
    },

    handleTreatmentImages(evt) {
      const files  = Array.from(evt.target.files);
      const slots  = 5 - (this.treatment.prescription_images || []).length;
      const toLoad = files.slice(0, slots);
      toLoad.forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
          this.$toast && this.$toast(`${file.name} skipped — must be under 2 MB.`, "warning");
          return;
        }
        const reader = new FileReader();
        reader.onload = e => this.treatment.prescription_images.push(e.target.result);
        reader.readAsDataURL(file);
      });
      evt.target.value = "";
    },

    // ─── Medicines ─────────────────────────────────────────────
    addMedicine() {
      this.medicines.push({
        name: "", strength: "", dosage: "1 tab", frequency: "BD",
        duration: "5 days", food: "After Food",
        timing: ["8:00 AM", "8:00 PM", "", ""], notes: ""
      });
    },
    duplicateMedicine(i) {
      const m = { ...this.medicines[i], timing: [...this.medicines[i].timing] };
      this.medicines.splice(i + 1, 0, m);
    },
    addTemplate() {
      const tpl = [
        { name: "Paracetamol",  strength: "650mg", dosage: "1 tab", frequency: "TDS", duration: "5 days", food: "After Food",  timing: ["8:00 AM","2:00 PM","8:00 PM",""], notes: "" },
        { name: "Amoxicillin",  strength: "500mg", dosage: "1 cap", frequency: "TDS", duration: "5 days", food: "After Food",  timing: ["8:00 AM","2:00 PM","8:00 PM",""], notes: "" },
        { name: "Pantoprazole", strength: "40mg",  dosage: "1 tab", frequency: "OD",  duration: "5 days", food: "Before Food", timing: ["8:00 AM","","",""],              notes: "" },
        { name: "Cetirizine",   strength: "10mg",  dosage: "1 tab", frequency: "HS",  duration: "5 days", food: "After Food",  timing: ["10:00 PM","","",""],             notes: "" }
      ];
      tpl.forEach(m => this.medicines.push({ ...m, timing: [...m.timing] }));
    },
    timingStr(m) {
      if (!m.timing || !Array.isArray(m.timing)) return "";
      const count = this.freqCounts[m.frequency] || 1;
      return m.timing.slice(0, count).filter(Boolean).join(" & ");
    },

    // ─── Autosave ──────────────────────────────────────────────
    autosave() {
      if (this.isEdit) return;
      // Strip image blobs before storing in localStorage to avoid quota issues
      const treatmentNoImgs = { ...this.treatment, prescription_images: [] };
      const invsNoImgs      = this.investigations.map(inv => ({ ...inv, image: null }));
      const draft = {
        patient: this.patient, visit: this.visit, exam: this.exam,
        diag: this.diag, treatment: treatmentNoImgs, billing: this.billing,
        medicines: this.medicines, investigations: invsNoImgs,
        activeStep: this.activeStep, showPatientForm: this.showPatientForm,
        patientQuery: this.patientQuery
      };
      localStorage.setItem("cp_draft", JSON.stringify(draft));
      const t = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      this.autosaveLabel = "Draft auto-saved at " + t;
      setTimeout(() => { if (this.autosaveLabel.startsWith("Draft auto")) this.autosaveLabel = ""; }, 3000);
    },

    loadDraft() {
      if (this.isEdit) return;
      const raw = localStorage.getItem("cp_draft");
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (d.patient)        this.patient        = d.patient;
        if (d.visit)          this.visit          = d.visit;
        if (d.exam)           this.exam           = d.exam;
        if (d.diag)           this.diag           = d.diag;
        if (d.treatment)      this.treatment      = d.treatment;
        if (d.billing)        this.billing        = d.billing;
        if (d.medicines)      this.medicines      = d.medicines;
        if (d.investigations) this.investigations = d.investigations;
        if (d.showPatientForm)this.showPatientForm= d.showPatientForm;
        if (d.patientQuery)   this.patientQuery   = d.patientQuery;
        this.autosaveLabel = "Draft restored";
        setTimeout(() => { this.autosaveLabel = ""; }, 3000);
      } catch { /* corrupt draft, ignore */ }
    },

    clearDraft() { localStorage.removeItem("cp_draft"); },

    // ─── Print ─────────────────────────────────────────────────
    printPrescription() {
      this.activeStep = 6;
      this.$nextTick(() => window.print());
    },

    // ─── Load for edit ─────────────────────────────────────────
    async loadCasepaper(id) {
      try {
        const res = await fetch(`/api/casepaper/${id}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (!res.ok) return;
        const d = await res.json();

        if (d.patient && d.patient.id) {
          this.patient         = { ...d.patient };
          this.showPatientForm = true;
          this.patientQuery    = d.patient.full_name || "";
        }

        const vi = d.visit_info || {};
        this.visit = {
          created_at:           d.created_at ? d.created_at.slice(0, 16) : this.visit.created_at,
          visit_type:           d.visit_type || vi.visit_type || "new",
          duration_complaints:  vi.duration_complaints  || "",
          chief_complaints:     vi.chief_complaints     || "",
          hpi:                  vi.hpi                  || "",
          past_medical_history: vi.past_medical_history || "",
          family_history:       vi.family_history       || "",
          allergy_history:      vi.allergy_history      || "",
          current_medications:  vi.current_medications  || "",
          lifestyle_history:    vi.lifestyle_history    || ""
        };

        const vt = d.vitals      || {};
        const ex = d.examination || {};
        this.exam = {
          pulse:               vt.pulse               || "",
          bp:                  vt.bp                  || "",
          temperature:         vt.temperature         || "",
          spo2:                vt.spo2                || "",
          respiratory_rate:    vt.respiratory_rate    || "",
          weight:              vt.weight              || null,
          height:              vt.height              || null,
          symptoms:            ex.symptoms            || d.symptoms || "",
          general_examination: ex.general_examination || "",
          systemic_examination:ex.systemic_examination|| "",
          findings:            ex.findings            || ""
        };

        const dd = d.diagnosis_detail || {};
        this.diag = {
          provisional_diagnosis: dd.provisional_diagnosis || "",
          final_diagnosis:       dd.final_diagnosis       || d.diagnosis || "",
          icd_code:              dd.icd_code              || "",
          severity:              dd.severity              || "",
          notes:                 dd.notes                 || ""
        };

        const td = d.treatment_detail || {};
        this.treatment = {
          injection_given:     td.injection_given     || "",
          procedure_done:      td.procedure_done      || "",
          dressing:            td.dressing            || "",
          nebulization:        td.nebulization        || "",
          physiotherapy:       td.physiotherapy       || "",
          surgery_notes:       td.surgery_notes       || "",
          treatment_notes:     td.treatment_notes     || "",
          prescription_images: Array.isArray(td.prescription_images) ? td.prescription_images : []
        };

        this.medicines = Array.isArray(d.medicines)
          ? d.medicines.map(m => ({
              ...m,
              timing: Array.isArray(m.timing) ? [...m.timing,"","","",""].slice(0, 4) : ["","","",""]
            }))
          : [];
        this.investigations = Array.isArray(d.investigations) ? d.investigations : [];

        this.billing = {
          charges:        d.charges         ?? 150,
          amount_paid:    d.amount_paid     ?? null,
          payment_status: d.payment_status  || "paid",
          payment_method: d.payment_method  || "cash",
          next_followup:  d.next_followup   || "",
          notes:          d.notes           || ""
        };
      } catch (err) {
        console.error("Failed to load casepaper:", err);
        this.$toast && this.$toast("Failed to load casepaper. Please refresh.", "danger");
      }
    },

    // ─── Reset ─────────────────────────────────────────────────
    resetForm() {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      this.patient = { id: null, full_name: "", dob: "", age: null, sex: "", weight: null, height: null, blood_group: "", phone: "", address: "", pincode: "", emergency_contact: "" };
      this.patientQuery    = "";
      this.showPatientForm = false;
      this.visit       = { created_at: localNow, visit_type: "new", duration_complaints: "", chief_complaints: "", hpi: "", past_medical_history: "", family_history: "", allergy_history: "", current_medications: "", lifestyle_history: "" };
      this.exam        = { pulse: "", bp: "", temperature: "", spo2: "", respiratory_rate: "", weight: null, height: null, symptoms: "", general_examination: "", systemic_examination: "", findings: "" };
      this.investigations = [];
      this.medicines      = [];
      this.diag        = { provisional_diagnosis: "", final_diagnosis: "", icd_code: "", severity: "", notes: "" };
      this.treatment   = { injection_given: "", procedure_done: "", dressing: "", nebulization: "", physiotherapy: "", surgery_notes: "", treatment_notes: "", prescription_images: [] };
      this.billing     = { charges: 150, amount_paid: null, payment_status: "paid", payment_method: "cash", next_followup: "", notes: "" };
      this.errors      = { full_name: "", phone: "", chief_complaints: "", diagnosis: "", charges: "" };
      this.activeStep  = 0;
      this.saveError   = null;
      this.showReview  = false;
    },

    formatDate(dt) {
      if (!dt) return "";
      const d = new Date(dt);
      if (isNaN(d)) return dt;
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  },

  async mounted() {
    try {
      const res = await fetch("/api/doctor/profile", {
        headers: { "Authentication-Token": this.token }
      });
      if (res.ok) {
        const p = await res.json();
        this.doctorName   = p.full_name || this.doctorName;
        this.doctorDegree = p.degree    || "";
      }
    } catch { /* non-critical */ }

    if (this.isEdit) {
      await this.loadCasepaper(this.$route.params.id);
    } else {
      this.loadDraft();
      this._autosaveInterval = setInterval(() => this.autosave(), 20000);
    }
  },

  beforeDestroy() {
    if (this._autosaveInterval) clearInterval(this._autosaveInterval);
  }
};
