export default {
  template: `
  <div class="container p-4">
    <h2 class="fw-bold mb-1">Reports</h2>
    <p class="text-muted mb-4">Download or upload financial and clinical reports</p>
    <hr class="custom-hr">

    <!-- Filters shared across download reports -->
    <div class="card border-0 shadow-sm mb-5">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Select Period</h6>
        <div class="row g-2">
          <div class="col-md-3">
            <select v-model="filterMonth" class="form-select">
              <option value="">All Months</option>
              <option v-for="(m, i) in months" :key="i+1" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <input v-model.number="filterYear" type="number" class="form-control" placeholder="Year e.g. 2025" />
          </div>
        </div>
      </div>
    </div>

    <!-- Report Cards -->
    <div class="row g-4">

      <!-- Monthly Earnings -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <div class="fs-1 mb-2">📊</div>
            <h5 class="fw-bold">Monthly Earnings</h5>
            <p class="text-muted">
              Consultation-wise earnings breakdown. Opens in Excel.
              Includes patient name, date, charges, and diagnosis.
            </p>
            <div class="text-muted small mb-3">
              Period: {{ filterMonth ? months[filterMonth-1] : 'All months' }}
              {{ filterYear || '' }}
            </div>

            <!-- Download -->
            <button
              class="btn btn-success w-100 mb-3"
              @click="download('monthly-earnings')"
              :disabled="downloading === 'monthly-earnings'">
              {{ downloading === 'monthly-earnings' ? 'Downloading...' : '⬇ Download CSV' }}
            </button>

            <hr class="my-1">

            <!-- Upload -->
            <div class="mt-2">
              <div class="text-muted small fw-semibold mb-2">⬆ Upload Earnings (CSV or Excel)</div>
              <div class="text-muted" style="font-size:11px" class="mb-2">
                Same columns as downloaded file:
                <code>#, Date, Patient, Phone, Symptoms, Diagnosis, Charges (₹)</code>
              </div>
              <div class="d-flex gap-2 mt-2">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  ref="earningsFile"
                  class="form-control form-control-sm"
                  @change="earningsFileSelected = $event.target.files[0]"
                />
                <button
                  class="btn btn-outline-success btn-sm"
                  style="white-space:nowrap"
                  @click="upload('casepapers', 'earningsFile')"
                  :disabled="!earningsFileSelected || uploading === 'casepapers'">
                  {{ uploading === 'casepapers' ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
              <div v-if="uploadResults.casepapers" class="mt-2">
                <div
                  :class="uploadResults.casepapers.error
                    ? 'alert alert-danger py-1 px-2 small mb-1'
                    : 'alert alert-success py-1 px-2 small mb-1'">
                  <span v-if="uploadResults.casepapers.error">
                    {{ uploadResults.casepapers.error }}
                  </span>
                  <span v-else>
                    ✓ {{ uploadResults.casepapers.created }} casepaper(s) imported.
                  </span>
                </div>
                <div
                  v-for="(e, i) in (uploadResults.casepapers.errors || [])"
                  :key="i"
                  class="alert alert-warning py-1 px-2 mb-1"
                  style="font-size:11px">
                  {{ e }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Patient List -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <div class="fs-1 mb-2">🧑‍⚕️</div>
            <h5 class="fw-bold">Patient List</h5>
            <p class="text-muted">
              Complete list of all registered patients with contact details,
              DOB, age, sex, and address.
            </p>
            <div class="text-muted small mb-3">All patients (no date filter)</div>

            <!-- Download -->
            <button
              class="btn btn-primary w-100 mb-3"
              @click="download('patient-list')"
              :disabled="downloading === 'patient-list'">
              {{ downloading === 'patient-list' ? 'Downloading...' : '⬇ Download CSV' }}
            </button>

            <hr class="my-1">

            <!-- Upload -->
            <div class="mt-2">
              <div class="text-muted small fw-semibold mb-2">⬆ Upload Patient List (CSV or Excel)</div>
              <div class="text-muted mb-2" style="font-size:11px">
                Same columns as downloaded file:
                <code>#, Name, DOB, Age, Sex, Phone, Address, Pincode, Weight</code>
              </div>
              <div class="d-flex gap-2 mt-2">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  ref="patientFile"
                  class="form-control form-control-sm"
                  @change="patientFileSelected = $event.target.files[0]"
                />
                <button
                  class="btn btn-outline-primary btn-sm"
                  style="white-space:nowrap"
                  @click="upload('patients', 'patientFile')"
                  :disabled="!patientFileSelected || uploading === 'patients'">
                  {{ uploading === 'patients' ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
              <div v-if="uploadResults.patients" class="mt-2">
                <div
                  :class="uploadResults.patients.error
                    ? 'alert alert-danger py-1 px-2 small mb-1'
                    : 'alert alert-success py-1 px-2 small mb-1'">
                  <span v-if="uploadResults.patients.error">
                    {{ uploadResults.patients.error }}
                  </span>
                  <span v-else>
                    ✓ {{ uploadResults.patients.created }} patient(s) imported.
                  </span>
                </div>
                <div
                  v-for="(e, i) in (uploadResults.patients.errors || [])"
                  :key="i"
                  class="alert alert-warning py-1 px-2 mb-1"
                  style="font-size:11px">
                  {{ e }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tax Report — download only -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="fs-1 mb-2">🧾</div>
            <h5 class="fw-bold">Tax Summary</h5>
            <p class="text-muted">
              Month-by-month income breakdown with estimated tax at 30%.
              Use this for income tax filing.
            </p>
            <div class="text-muted small mb-3">
              Year: {{ filterYear || new Date().getFullYear() }}
            </div>
            <button
              class="btn btn-warning w-100"
              @click="download('tax-summary')"
              :disabled="downloading === 'tax-summary'">
              {{ downloading === 'tax-summary' ? 'Downloading...' : '⬇ Download Tax Report' }}
            </button>
          </div>
        </div>
      </div>

      <!-- GST Summary — download only -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="fs-1 mb-2">🏛️</div>
            <h5 class="fw-bold">GST Summary</h5>
            <p class="text-muted">
              Expense breakdown by category with GST @ 18%.
              Note: Medical consultations are GST-exempt in India.
            </p>
            <div class="text-muted small mb-3">
              Year: {{ filterYear || new Date().getFullYear() }}
            </div>
            <button
              class="btn btn-danger w-100"
              @click="download('gst-summary')"
              :disabled="downloading === 'gst-summary'">
              {{ downloading === 'gst-summary' ? 'Downloading...' : '⬇ Download GST Report' }}
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Note -->
    <div class="alert alert-info mt-5">
      <strong>Note:</strong> Reports download as <strong>.csv</strong> files (open in Excel, Google Sheets, or LibreOffice).
      You can upload the file back as either <strong>.csv</strong> or <strong>.xlsx</strong> (Excel) —
      column headers must match exactly. Extra columns are ignored; missing required columns will be skipped.
    </div>
  </div>
  `,

  data() {
    return {
      token:               localStorage.getItem("auth-token"),
      userId:              localStorage.getItem("user_id"),
      filterMonth:         '',
      filterYear:          new Date().getFullYear(),
      downloading:         null,
      uploading:           null,
      uploadResults:       {},
      patientFileSelected: null,
      earningsFileSelected:null,
      months: ["January","February","March","April","May","June",
               "July","August","September","October","November","December"]
    };
  },

  methods: {
    async download(reportType) {
      this.downloading = reportType;
      try {
        const params = new URLSearchParams({ doctor_id: this.userId });
        if (this.filterMonth) params.append("month", this.filterMonth);
        if (this.filterYear)  params.append("year",  this.filterYear);

        const res = await fetch(`/api/reports/${reportType}?${params}`, {
          headers: { "Authentication-Token": this.token }
        });

        if (!res.ok) {
          alert("Failed to generate report. Please try again.");
          return;
        }

        const blob        = await res.blob();
        const url         = window.URL.createObjectURL(blob);
        const a           = document.createElement("a");
        a.href            = url;
        const disposition = res.headers.get("Content-Disposition") || "";
        const match       = disposition.match(/filename=(.+)/);
        a.download        = match ? match[1] : `${reportType}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

      } catch (err) {
        console.error("Download error:", err);
        alert("Download failed. Please try again.");
      } finally {
        this.downloading = null;
      }
    },

    async upload(type, refName) {
      const fileInput = this.$refs[refName];
      const file      = fileInput && fileInput.files[0];
      if (!file) return;

      this.uploading = type;
      this.$set(this.uploadResults, type, null);

      const form = new FormData();
      form.append("file", file);

      try {
        const res  = await fetch(`/api/upload/${type}`, {
          method:  "POST",
          headers: { "Authentication-Token": this.token },
          body:    form
        });
        const data = await res.json();

        this.$set(this.uploadResults, type, data);

        // Reset the file input
        fileInput.value = "";
        if (type === "patients")   this.patientFileSelected  = null;
        if (type === "casepapers") this.earningsFileSelected = null;

      } catch (err) {
        console.error("Upload error:", err);
        this.$set(this.uploadResults, type, { error: "Upload failed. Please try again." });
      } finally {
        this.uploading = null;
      }
    }
  }
};
