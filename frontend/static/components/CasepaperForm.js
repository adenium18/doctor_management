export default {
  template: `
  <div class="casepaper-form-root">

    <!-- ── Sticky header ───────────────────────────────────────────── -->
    <div class="d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom sticky-top" style="z-index:120">
      <div class="d-flex align-items-center gap-2">
        <button v-if="isEdit" class="btn btn-sm btn-outline-secondary" @click="$router.push('/casepapers')">← Records</button>
        <div>
          <div class="fw-bold" style="font-size:13px">
            {{ isEdit ? (patient.full_name || 'Edit Casepaper') : 'New Casepaper' }}
          </div>
          <div class="text-muted" style="font-size:11px">
            {{ isEdit ? 'Editing #' + $route.params.id : 'Fill in patient details and clinical notes' }}
            <span v-if="patient.age" class="ms-1">· {{ patient.age }}y {{ patient.sex || '' }}</span>
          </div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary d-print-none" @click="printPrescription">🖨 Print Rx</button>
        <button class="btn btn-sm btn-primary d-print-none" @click="save" :disabled="saving">
          {{ saving ? 'Saving…' : (isEdit ? 'Update' : 'Save') }}
        </button>
      </div>
    </div>

    <!-- ── Tab navigation ──────────────────────────────────────────── -->
    <div class="d-print-none bg-white border-bottom" style="overflow-x:auto;white-space:nowrap">
      <div class="d-inline-flex px-2 py-1 gap-1">
        <button v-for="(tab, i) in tabs" :key="i"
          class="btn btn-sm"
          style="border-radius:20px;font-size:12px;padding:3px 12px"
          :class="activeTab === i ? 'btn-primary' : 'btn-outline-secondary'"
          @click="activeTab = i">
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- ── Form content ────────────────────────────────────────────── -->
    <div class="py-3 px-2 px-md-3" style="max-width:960px;margin:0 auto">

      <!-- ===================== TAB 0 · PATIENT ===================== -->
      <div v-show="activeTab === 0" class="d-print-none">
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="fw-bold text-primary mb-3">Patient Search</h6>

            <!-- Autocomplete search -->
            <div class="position-relative mb-3" v-click-outside="closeDropdown">
              <input v-model="patientQuery"
                class="form-control"
                placeholder="Type patient name or phone…"
                autocomplete="off"
                @input="onPatientSearch"
                @focus="dropdownOpen = true" />
              <div v-if="dropdownOpen && (patientResults.length || patientQuery.length > 1)"
                class="position-absolute w-100 bg-white border rounded shadow"
                style="z-index:300;top:calc(100% + 2px);max-height:260px;overflow-y:auto">
                <div v-for="p in patientResults" :key="p.id"
                  class="px-3 py-2 border-bottom"
                  style="cursor:pointer"
                  :style="hoveredPatient===p.id ? 'background:#f0f7ff' : ''"
                  @mouseover="hoveredPatient=p.id"
                  @mouseleave="hoveredPatient=null"
                  @mousedown.prevent="selectPatient(p)">
                  <div class="fw-semibold" style="font-size:13px">{{ p.full_name }}</div>
                  <div class="text-muted" style="font-size:11px">
                    {{ [p.age ? p.age+'y' : '', p.sex, p.phone].filter(Boolean).join(' · ') }}
                    <span v-if="p.last_visit" class="ms-2 text-success">Last visit: {{ formatDate(p.last_visit) }}</span>
                  </div>
                </div>
                <div v-if="patientQuery.length > 1"
                  class="px-3 py-2 text-primary fw-semibold"
                  style="cursor:pointer;font-size:13px"
                  @mousedown.prevent="useNewPatient">
                  + Create new patient "{{ patientQuery }}"
                </div>
              </div>
            </div>

            <!-- Patient fields -->
            <div v-if="showPatientForm">
              <div class="row g-2">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Full Name *</label>
                  <input v-model="patient.full_name" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-semibold">Date of Birth</label>
                  <input v-model="patient.dob" type="date" class="form-control" @change="calcAge" />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-semibold">Age (yrs)</label>
                  <input v-model.number="patient.age" type="number" class="form-control" placeholder="Auto from DOB" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small fw-semibold">Gender</label>
                  <select v-model="patient.sex" class="form-select">
                    <option value="">—</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small fw-semibold">Weight (kg)</label>
                  <input v-model.number="patient.weight" type="number" step="0.1" class="form-control" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small fw-semibold">Height (cm)</label>
                  <input v-model.number="patient.height" type="number" step="0.1" class="form-control" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small fw-semibold">Blood Group</label>
                  <select v-model="patient.blood_group" class="form-select">
                    <option value="">—</option>
                    <option v-for="bg in bloodGroups" :key="bg">{{ bg }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-semibold">Phone</label>
                  <input v-model="patient.phone" type="tel" class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-semibold">Emergency Contact</label>
                  <input v-model="patient.emergency_contact" class="form-control" placeholder="Name & phone" />
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-semibold">Pincode</label>
                  <input v-model="patient.pincode" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold">Address</label>
                  <input v-model="patient.address" class="form-control" />
                </div>
              </div>
            </div>
            <div v-else class="text-muted small text-center py-3">
              Search for a patient above or create a new one.
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== TAB 1 · VISIT INFO =================== -->
      <div v-show="activeTab === 1" class="d-print-none">
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="fw-bold text-primary mb-3">Visit Information</h6>
            <div class="row g-2">
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Visit Date & Time</label>
                <input v-model="visit.created_at" type="datetime-local" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Visit Type</label>
                <select v-model="visit.visit_type" class="form-select">
                  <option value="new">New Visit</option>
                  <option value="follow_up">Follow-Up</option>
                  <option value="emergency">Emergency</option>
                  <option value="online">Online Consultation</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Duration of Complaints</label>
                <input v-model="visit.duration_complaints" class="form-control" placeholder="3 days, 1 week…" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">Chief Complaints</label>
                <textarea v-model="visit.chief_complaints" class="form-control" rows="3" placeholder="Main complaints…"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">History of Present Illness</label>
                <textarea v-model="visit.hpi" class="form-control" rows="3" placeholder="Detailed current illness history…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Past Medical History</label>
                <textarea v-model="visit.past_medical_history" class="form-control" rows="3" placeholder="Diabetes, hypertension, surgeries…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Family History</label>
                <textarea v-model="visit.family_history" class="form-control" rows="3" placeholder="Relevant family conditions…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Allergy History</label>
                <textarea v-model="visit.allergy_history" class="form-control" rows="2" placeholder="Drug / food allergies…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Current Medications</label>
                <textarea v-model="visit.current_medications" class="form-control" rows="2" placeholder="Medicines currently being taken…"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">Lifestyle History</label>
                <input v-model="visit.lifestyle_history" class="form-control" placeholder="Smoking, alcohol, diet, exercise…" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2 · EXAMINATION ==================== -->
      <div v-show="activeTab === 2" class="d-print-none">
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="fw-bold text-primary mb-3">Vitals</h6>
            <div class="row g-2 mb-3">
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">Pulse (bpm)</label>
                <input v-model="exam.pulse" class="form-control" placeholder="80" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">BP (mmHg)</label>
                <input v-model="exam.bp" class="form-control" placeholder="120/80" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">Temp (°F)</label>
                <input v-model="exam.temperature" class="form-control" placeholder="98.6" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">SpO2 (%)</label>
                <input v-model="exam.spo2" class="form-control" placeholder="99" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">RR (breaths/min)</label>
                <input v-model="exam.respiratory_rate" class="form-control" placeholder="18" />
              </div>
              <div class="col-6 col-md-1">
                <label class="form-label small fw-semibold">Wt (kg)</label>
                <input v-model.number="exam.weight" type="number" step="0.1" class="form-control" />
              </div>
              <div class="col-6 col-md-1">
                <label class="form-label small fw-semibold">Ht (cm)</label>
                <input v-model.number="exam.height" type="number" step="0.1" class="form-control" />
              </div>
              <div class="col-6 col-md-2">
                <label class="form-label small fw-semibold">BMI</label>
                <input :value="bmi || ''" class="form-control bg-light fw-bold" readonly placeholder="Auto" />
              </div>
            </div>
            <hr class="my-2">
            <h6 class="fw-bold text-primary mb-3">Examination</h6>
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small fw-semibold">Symptoms / Presenting Complaints</label>
                <textarea v-model="exam.symptoms" class="form-control" rows="2" placeholder="Presenting symptoms…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">General Examination</label>
                <textarea v-model="exam.general_examination" class="form-control" rows="3" placeholder="Conscious, oriented, pallor, icterus, clubbing, cyanosis, lymphadenopathy, oedema…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Systemic Examination</label>
                <textarea v-model="exam.systemic_examination" class="form-control" rows="3" placeholder="CVS, RS, CNS, P/A findings…"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">Key Findings</label>
                <textarea v-model="exam.findings" class="form-control" rows="2" placeholder="Clinical findings…"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================ TAB 3 · INVESTIGATIONS ================== -->
      <div v-show="activeTab === 3" class="d-print-none">
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold text-primary mb-0">Investigations</h6>
              <button class="btn btn-sm btn-outline-primary" @click="addInvestigation">+ Add Row</button>
            </div>
            <!-- Quick-add chips -->
            <div class="d-flex flex-wrap gap-1 mb-3">
              <button v-for="inv in quickInv" :key="inv"
                class="btn btn-outline-secondary btn-sm"
                style="font-size:11px;padding:2px 10px;border-radius:14px"
                @click="addQuickInv(inv)">{{ inv }}</button>
            </div>
            <div v-if="!investigations.length" class="text-muted text-center py-3 small">
              No investigations added.
            </div>
            <div v-for="(inv, i) in investigations" :key="i" class="border rounded p-2 mb-2">
              <div class="row g-2 align-items-end">
                <div class="col-md-3">
                  <label class="form-label small mb-1">Investigation</label>
                  <input v-model="inv.name" class="form-control form-control-sm" placeholder="CBC, X-Ray…" />
                </div>
                <div class="col-md-4">
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
                <div class="col-md-1">
                  <button class="btn btn-sm btn-outline-danger w-100" style="padding:4px 0" @click="investigations.splice(i,1)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================== TAB 4 · DIAGNOSIS ==================== -->
      <div v-show="activeTab === 4" class="d-print-none">
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="fw-bold text-primary mb-3">Diagnosis</h6>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Provisional Diagnosis</label>
                <textarea v-model="diag.provisional_diagnosis" class="form-control" rows="2" placeholder="Working diagnosis…"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Final Diagnosis</label>
                <textarea v-model="diag.final_diagnosis" class="form-control" rows="2" placeholder="Confirmed diagnosis…"></textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">ICD-10 Code (optional)</label>
                <input v-model="diag.icd_code" class="form-control" placeholder="J06.9" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Severity</label>
                <select v-model="diag.severity" class="form-select">
                  <option value="">Not specified</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Next Follow-Up</label>
                <input v-model="billing.next_followup" type="date" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">Notes</label>
                <textarea v-model="diag.notes" class="form-control" rows="2"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================ TAB 5 · TREATMENT ====================== -->
      <div v-show="activeTab === 5" class="d-print-none">
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="fw-bold text-primary mb-3">Treatment Given</h6>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Injection Given</label>
                <input v-model="treatment.injection_given" class="form-control" placeholder="Name, dose, route…" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-semibold">Procedure Done</label>
                <input v-model="treatment.procedure_done" class="form-control" placeholder="Procedure name / details…" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Dressing</label>
                <input v-model="treatment.dressing" class="form-control" placeholder="Type / area…" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Nebulization</label>
                <input v-model="treatment.nebulization" class="form-control" placeholder="Drug + dose…" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Physiotherapy</label>
                <input v-model="treatment.physiotherapy" class="form-control" placeholder="Type / sessions…" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">Surgery Notes</label>
                <textarea v-model="treatment.surgery_notes" class="form-control" rows="2"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label small fw-semibold">Treatment Notes / Advice</label>
                <textarea v-model="treatment.treatment_notes" class="form-control" rows="3" placeholder="General instructions, rest, diet advice…"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =============== TAB 6 · PRESCRIPTION ==================== -->
      <div v-show="activeTab === 6">

        <!-- Builder (hidden on print) -->
        <div class="card mb-3 d-print-none">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold text-primary mb-0">Prescription Builder</h6>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" @click="addTemplate">Common Rx</button>
                <button class="btn btn-sm btn-outline-primary" @click="addMedicine">+ Add</button>
              </div>
            </div>
            <div v-if="!medicines.length" class="text-muted text-center small py-3">
              No medicines yet. Click + Add or use Common Rx.
            </div>
            <div v-for="(med, i) in medicines" :key="i"
              class="border rounded p-2 mb-2 bg-light">
              <div class="row g-1 align-items-end">
                <div class="col-12 col-md-3">
                  <label class="form-label small mb-0">Medicine</label>
                  <input v-model="med.name" class="form-control form-control-sm" placeholder="Paracetamol…" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small mb-0">Strength</label>
                  <input v-model="med.strength" class="form-control form-control-sm" placeholder="500mg" />
                </div>
                <div class="col-6 col-md-1">
                  <label class="form-label small mb-0">Dose</label>
                  <input v-model="med.dosage" class="form-control form-control-sm" placeholder="1 tab" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small mb-0">Frequency</label>
                  <select v-model="med.frequency" class="form-select form-select-sm">
                    <option value="OD">OD – Once/day</option>
                    <option value="BD">BD – Twice/day</option>
                    <option value="TDS">TDS – Thrice/day</option>
                    <option value="QID">QID – 4×/day</option>
                    <option value="SOS">SOS – As needed</option>
                    <option value="HS">HS – Bedtime</option>
                    <option value="Stat">Stat – Immediately</option>
                  </select>
                </div>
                <div class="col-6 col-md-1">
                  <label class="form-label small mb-0">Duration</label>
                  <input v-model="med.duration" class="form-control form-control-sm" placeholder="5 days" />
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label small mb-0">Food</label>
                  <select v-model="med.food" class="form-select form-select-sm">
                    <option>After Food</option>
                    <option>Before Food</option>
                    <option>With Food</option>
                    <option>Empty Stomach</option>
                  </select>
                </div>
                <div class="col-md-1 d-flex align-items-end justify-content-end">
                  <button class="btn btn-sm btn-outline-danger" style="padding:4px 8px" @click="medicines.splice(i,1)">✕</button>
                </div>
              </div>
              <div class="mt-1">
                <input v-model="med.notes" class="form-control form-control-sm" placeholder="Timing / extra notes (e.g. 8AM & 8PM)" />
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Printable prescription ──────────────────────────────── -->
        <div class="card mb-3" id="printable-rx">
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
              <strong>Patient:</strong> {{ patient.full_name }}
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
                  <tr>
                    <th style="width:30px">#</th>
                    <th>Medicine</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in medicines" :key="i">
                    <td>{{ i+1 }}</td>
                    <td class="fw-semibold">{{ m.name }} <span class="fw-normal text-muted">{{ m.strength }}</span></td>
                    <td>{{ m.dosage }}</td>
                    <td>{{ m.frequency }}</td>
                    <td>{{ m.duration }}</td>
                    <td>{{ m.food }}<span v-if="m.notes"> · {{ m.notes }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted small mb-2">No medicines prescribed.</div>
            <div v-if="treatment.treatment_notes" class="mt-1" style="font-size:13px">
              <strong>Advice:</strong> {{ treatment.treatment_notes }}
            </div>
            <div class="text-end mt-3 d-print-none">
              <button class="btn btn-sm btn-outline-secondary" @click="printPrescription">🖨 Print Prescription</button>
            </div>
          </div>
        </div>

      </div>

      <!-- ────── Bottom bar: Charges + Save (always visible) ──────── -->
      <div class="card mb-4 d-print-none">
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold">Charges (₹)</label>
              <input v-model.number="billing.charges" type="number" class="form-control" min="0" />
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label small fw-semibold">Payment Status</label>
              <select v-model="billing.payment_status" class="form-select">
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-semibold">Next Follow-Up</label>
              <input v-model="billing.next_followup" type="date" class="form-control" />
            </div>
            <div class="col-md-3 d-flex gap-2">
              <button v-if="isEdit" class="btn btn-secondary flex-grow-1" @click="$router.push('/casepapers')">Cancel</button>
              <button v-else class="btn btn-outline-secondary flex-grow-1" @click="resetForm">Clear</button>
              <button class="btn btn-primary flex-grow-1" @click="save" :disabled="saving">
                {{ saving ? 'Saving…' : (isEdit ? 'Update' : 'Save') }}
              </button>
            </div>
          </div>
          <div class="mt-2">
            <label class="form-label small fw-semibold">Internal Notes</label>
            <input v-model="billing.notes" class="form-control" placeholder="Notes visible only to you…" />
          </div>
          <div v-if="saveError" class="alert alert-danger py-1 px-2 small mt-2 mb-0">{{ saveError }}</div>
        </div>
      </div>

    </div>
  </div>
  `,

  directives: {
    clickOutside: {
      bind(el, binding) {
        el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(); };
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
      saving:      false,
      saveError:   null,
      activeTab:   0,

      // Patient autocomplete
      patientQuery:   "",
      patientResults: [],
      searchTimer:    null,
      dropdownOpen:   false,
      hoveredPatient: null,
      showPatientForm:false,

      // Patient data
      patient: {
        id: null, full_name: "", dob: "", age: null, sex: "", weight: null,
        height: null, blood_group: "", phone: "", address: "", pincode: "",
        emergency_contact: ""
      },

      // Visit info
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
        nebulization: "", physiotherapy: "", surgery_notes: "", treatment_notes: ""
      },

      billing: {
        charges: 150, payment_status: "paid", next_followup: "", notes: ""
      },

      tabs: ["Patient", "Visit", "Examination", "Investigations", "Diagnosis", "Treatment", "Prescription"],

      bloodGroups: ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"],

      quickInv: ["CBC", "LFT", "KFT", "Blood Sugar (F)", "Blood Sugar (PP)", "HbA1c",
                 "Urine R/M", "X-Ray Chest", "ECG", "Lipid Profile", "Thyroid (TSH)",
                 "USG Abdomen", "MRI Brain", "CT Scan", "Sputum AFB", "Dengue NS1"]
    };
  },

  computed: {
    isEdit() { return !!this.$route.params.id; },

    bmi() {
      const w = parseFloat(this.exam.weight) || parseFloat(this.patient.weight);
      const h = parseFloat(this.exam.height) || parseFloat(this.patient.height);
      if (w > 0 && h > 0) return (w / ((h / 100) ** 2)).toFixed(1);
      return null;
    }
  },

  methods: {
    // ── Patient search ──────────────────────────────────────────────
    onPatientSearch() {
      clearTimeout(this.searchTimer);
      if (this.patientQuery.length < 2) { this.patientResults = []; return; }
      this.searchTimer = setTimeout(async () => {
        try {
          const res  = await fetch(`/api/patient/search?query=${encodeURIComponent(this.patientQuery)}`, {
            headers: { "Authentication-Token": this.token }
          });
          this.patientResults = res.ok ? await res.json() : [];
          this.dropdownOpen   = true;
        } catch { this.patientResults = []; }
      }, 280);
    },

    selectPatient(p) {
      this.patient = {
        id:               p.id,
        full_name:        p.full_name        || "",
        dob:              p.dob              || "",
        age:              p.age              || null,
        sex:              p.sex              || "",
        weight:           p.weight           || null,
        height:           p.height           || null,
        blood_group:      p.blood_group      || "",
        phone:            p.phone            || "",
        address:          p.address          || "",
        pincode:          p.pincode          || "",
        emergency_contact:p.emergency_contact|| "",
      };
      this.patientQuery    = p.full_name;
      this.showPatientForm = true;
      this.dropdownOpen    = false;
    },

    useNewPatient() {
      this.patient.id        = null;
      this.patient.full_name = this.patientQuery;
      this.showPatientForm   = true;
      this.dropdownOpen      = false;
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

    // ── Investigations ──────────────────────────────────────────────
    addInvestigation() {
      this.investigations.push({ name: "", result: "", date: "", notes: "" });
    },
    addQuickInv(name) {
      if (this.investigations.some(i => i.name === name)) return;
      this.investigations.push({ name, result: "", date: "", notes: "" });
    },

    // ── Medicines ───────────────────────────────────────────────────
    addMedicine() {
      this.medicines.push({ name: "", strength: "", dosage: "1 tab", frequency: "BD", duration: "5 days", food: "After Food", notes: "" });
    },
    addTemplate() {
      const tpl = [
        { name: "Paracetamol",      strength: "650mg", dosage: "1 tab", frequency: "TDS", duration: "5 days",  food: "After Food", notes: "" },
        { name: "Amoxicillin",      strength: "500mg", dosage: "1 cap", frequency: "TDS", duration: "5 days",  food: "After Food", notes: "" },
        { name: "Pantoprazole",     strength: "40mg",  dosage: "1 tab", frequency: "OD",  duration: "5 days",  food: "Before Food",notes: "Morning" },
        { name: "Cetirizine",       strength: "10mg",  dosage: "1 tab", frequency: "OD",  duration: "5 days",  food: "After Food", notes: "Night" },
      ];
      tpl.forEach(m => this.medicines.push({ ...m }));
    },

    // ── Save ────────────────────────────────────────────────────────
    async save() {
      this.saveError = null;
      if (!this.patient.full_name.trim()) {
        this.activeTab = 0;
        this.saveError = "Patient name is required.";
        return;
      }
      this.saving = true;
      try {
        // 1. Create patient if new
        let patientId = this.patient.id;
        if (!patientId) {
          const pr = await fetch("/api/patients", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
            body:    JSON.stringify({
              full_name:         this.patient.full_name,
              dob:               this.patient.dob        || null,
              age:               this.patient.age        || null,
              sex:               this.patient.sex        || null,
              weight:            this.patient.weight     || null,
              height:            this.patient.height     || null,
              blood_group:       this.patient.blood_group|| null,
              phone:             this.patient.phone      || null,
              address:           this.patient.address    || "",
              pincode:           this.patient.pincode    || "",
              emergency_contact: this.patient.emergency_contact || null,
            })
          });
          const pd = await pr.json();
          if (!pr.ok) { this.saveError = pd.error || "Failed to create patient."; return; }
          patientId = pd.id;
        }

        // 2. Build summary fields for list view
        const symptomsSummary    = this.exam.symptoms || this.visit.chief_complaints || "";
        const diagnosisSummary   = this.diag.final_diagnosis || this.diag.provisional_diagnosis || "";
        const prescriptionSummary = this.medicines.length
          ? this.medicines.map(m => `${m.name}${m.strength ? " "+m.strength : ""} ${m.frequency}`).join(", ")
          : "";

        // 3. Persist casepaper
        const payload = {
          patient_id:      patientId,
          created_at:      this.visit.created_at,
          visit_type:      this.visit.visit_type,
          symptoms:        symptomsSummary,
          diagnosis:       diagnosisSummary,
          prescription:    prescriptionSummary,
          charges:         this.billing.charges,
          payment_status:  this.billing.payment_status,
          notes:           this.billing.notes,
          next_followup:   this.billing.next_followup || null,
          // JSON blobs
          visit_info:       { ...this.visit },
          vitals:           { ...this.exam,
                               bmi: this.bmi,
                               weight: this.exam.weight || this.patient.weight,
                               height: this.exam.height || this.patient.height },
          examination:      { symptoms: this.exam.symptoms,
                               general_examination:  this.exam.general_examination,
                               systemic_examination: this.exam.systemic_examination,
                               findings:             this.exam.findings },
          diagnosis_detail: { ...this.diag },
          treatment_detail: { ...this.treatment },
          medicines:        this.medicines,
          investigations:   this.investigations,
        };

        const isEdit = this.isEdit;
        const url    = isEdit ? `/api/casepaper/${this.$route.params.id}` : "/api/casepaper";
        const method = isEdit ? "PUT" : "POST";

        const res  = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          if (this.isEdit) {
            this.$router.push("/casepapers");
          } else {
            this.$toast && this.$toast("Casepaper saved successfully!");
            this.resetForm();
          }
        } else {
          this.saveError = data.error || "Save failed.";
        }
      } catch (err) {
        this.saveError = "Network error. Please try again.";
        console.error(err);
      } finally {
        this.saving = false;
      }
    },

    // ── Print ───────────────────────────────────────────────────────
    printPrescription() {
      this.activeTab = 6;
      this.$nextTick(() => window.print());
    },

    // ── Load for edit ────────────────────────────────────────────────
    async loadCasepaper(id) {
      try {
        const res = await fetch(`/api/casepaper/${id}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (!res.ok) return;
        const d = await res.json();

        // Patient
        if (d.patient && d.patient.id) {
          this.patient         = { ...d.patient };
          this.showPatientForm = true;
          this.patientQuery    = d.patient.full_name || "";
        }

        // Visit
        const vi = d.visit_info || {};
        this.visit = {
          created_at:           d.created_at ? d.created_at.slice(0, 16) : this.visit.created_at,
          visit_type:           d.visit_type || vi.visit_type || "consultation",
          duration_complaints:  vi.duration_complaints  || "",
          chief_complaints:     vi.chief_complaints     || "",
          hpi:                  vi.hpi                  || "",
          past_medical_history: vi.past_medical_history || "",
          family_history:       vi.family_history        || "",
          allergy_history:      vi.allergy_history       || "",
          current_medications:  vi.current_medications  || "",
          lifestyle_history:    vi.lifestyle_history     || "",
        };

        // Vitals + exam
        const vt = d.vitals     || {};
        const ex = d.examination|| {};
        this.exam = {
          pulse:               vt.pulse              || "",
          bp:                  vt.bp                 || "",
          temperature:         vt.temperature        || "",
          spo2:                vt.spo2               || "",
          respiratory_rate:    vt.respiratory_rate   || "",
          weight:              vt.weight             || null,
          height:              vt.height             || null,
          symptoms:            ex.symptoms           || d.symptoms || "",
          general_examination: ex.general_examination  || "",
          systemic_examination:ex.systemic_examination || "",
          findings:            ex.findings            || "",
        };

        // Diagnosis
        const dd = d.diagnosis_detail || {};
        this.diag = {
          provisional_diagnosis: dd.provisional_diagnosis || "",
          final_diagnosis:       dd.final_diagnosis       || d.diagnosis || "",
          icd_code:              dd.icd_code              || "",
          severity:              dd.severity              || "",
          notes:                 dd.notes                 || "",
        };

        // Treatment
        const td = d.treatment_detail || {};
        this.treatment = {
          injection_given: td.injection_given || "",
          procedure_done:  td.procedure_done  || "",
          dressing:        td.dressing        || "",
          nebulization:    td.nebulization    || "",
          physiotherapy:   td.physiotherapy   || "",
          surgery_notes:   td.surgery_notes   || "",
          treatment_notes: td.treatment_notes || "",
        };

        this.medicines      = Array.isArray(d.medicines)     ? d.medicines      : [];
        this.investigations = Array.isArray(d.investigations) ? d.investigations : [];

        this.billing = {
          charges:        d.charges        || 150,
          payment_status: d.payment_status || "paid",
          next_followup:  d.next_followup  || "",
          notes:          d.notes          || "",
        };

      } catch (err) {
        console.error("Failed to load casepaper:", err);
      }
    },

    resetForm() {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      this.patient        = { id: null, full_name: "", dob: "", age: null, sex: "", weight: null, height: null, blood_group: "", phone: "", address: "", pincode: "", emergency_contact: "" };
      this.patientQuery   = "";
      this.showPatientForm= false;
      this.visit          = { created_at: localNow, visit_type: "new", duration_complaints: "", chief_complaints: "", hpi: "", past_medical_history: "", family_history: "", allergy_history: "", current_medications: "", lifestyle_history: "" };
      this.exam           = { pulse: "", bp: "", temperature: "", spo2: "", respiratory_rate: "", weight: null, height: null, symptoms: "", general_examination: "", systemic_examination: "", findings: "" };
      this.investigations = [];
      this.medicines      = [];
      this.diag           = { provisional_diagnosis: "", final_diagnosis: "", icd_code: "", severity: "", notes: "" };
      this.treatment      = { injection_given: "", procedure_done: "", dressing: "", nebulization: "", physiotherapy: "", surgery_notes: "", treatment_notes: "" };
      this.billing        = { charges: 150, payment_status: "paid", next_followup: "", notes: "" };
      this.activeTab      = 0;
      this.saveError      = null;
    },

    formatDate(dt) {
      if (!dt) return "";
      const d = new Date(dt);
      if (isNaN(d)) return dt;
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  },

  async mounted() {
    // Fetch doctor profile for prescription header
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
    }
  }
};
