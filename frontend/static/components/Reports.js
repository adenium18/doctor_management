export default {
  template: `
  <div class="container p-4">
    <h2 class="fw-bold mb-1">Reports</h2>
    <p class="text-muted mb-4">Download financial and clinical reports</p>
    <hr class="custom-hr">

    <!-- Filters shared across reports -->
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

      <!-- Monthly Earnings Excel -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
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
            <button
              class="btn btn-success w-100"
              @click="download('monthly-earnings')"
              :disabled="downloading === 'monthly-earnings'">
              {{ downloading === 'monthly-earnings' ? 'Downloading...' : '⬇ Download Excel / CSV' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Patient List -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="fs-1 mb-2">🧑‍⚕️</div>
            <h5 class="fw-bold">Patient List</h5>
            <p class="text-muted">
              Complete list of all registered patients with contact details,
              DOB, age, sex, and address.
            </p>
            <div class="text-muted small mb-3">All patients (no date filter)</div>
            <button
              class="btn btn-primary w-100"
              @click="download('patient-list')"
              :disabled="downloading === 'patient-list'">
              {{ downloading === 'patient-list' ? 'Downloading...' : '⬇ Download CSV' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tax Report -->
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

      <!-- GST Summary -->
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
      <strong>Note:</strong> All reports download as <strong>.csv</strong> files which open directly
      in Microsoft Excel, Google Sheets, or LibreOffice Calc.
      For PDF output, open the CSV in Excel and use File → Export → PDF.
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      userId:      localStorage.getItem("user_id"),
      filterMonth: '',
      filterYear:  new Date().getFullYear(),
      downloading: null,
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

        // Trigger browser download
        const blob        = await res.blob();
        const url         = window.URL.createObjectURL(blob);
        const a           = document.createElement("a");
        a.href            = url;
        // Get filename from content-disposition header if available
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
    }
  }
};