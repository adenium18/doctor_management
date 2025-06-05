export default {
  template: `
  <div class="container-fluid">
    <h1 class="text-center fw-bold">Welcome to Dr. A-to-Z 🏥</h1>
    <hr class="custom-hr">
    <h3 class="text-center text-success fw-bold">Manage Patient Casepapers with Ease</h3>

    <div class="container my-4">
      <div class="card mb-4">
        <div class="card-body">
          <h4 class="card-title">New Casepaper Entry</h4>
          <form>
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="patientName" class="form-label">Patient Name</label>
                <input type="text" id="patientName" class="form-control" placeholder="Enter patient name">
              </div>
              <div class="col-md-4">
                <label for="age" class="form-label">Age</label>
                <input type="number" id="age" class="form-control" placeholder="Age">
              </div>
              <div class="col-md-4">
                <label for="gender" class="form-label">Gender</label>
                <select id="gender" class="form-select">
                  <option selected disabled>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label for="symptoms" class="form-label">Symptoms</label>
              <textarea id="symptoms" class="form-control" rows="2" placeholder="Describe symptoms"></textarea>
            </div>

            <div class="mb-3">
              <label for="diagnosis" class="form-label">Diagnosis</label>
              <textarea id="diagnosis" class="form-control" rows="2" placeholder="Enter diagnosis details"></textarea>
            </div>

            <div class="mb-3">
              <label for="prescription" class="form-label">Prescription</label>
              <textarea id="prescription" class="form-control" rows="2" placeholder="Enter prescribed medication"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Save Casepaper</button>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h4 class="card-title">Patient Records</h4>
          <p class="text-muted">Recent entries will be listed here.</p>
          <!-- Placeholder for patient casepaper list -->
          <ul class="list-group">
            <li class="list-group-item">
              <strong>John Doe</strong> — Fever & Cough — <em>Paracetamol 500mg</em>
            </li>
            <li class="list-group-item">
              <strong>Priya Sharma</strong> — Headache — <em>Ibuprofen 400mg</em>
            </li>
            <!-- More entries to be dynamically added -->
          </ul>
        </div>
      </div>
    </div>

    <div class="card text-center mt-4">
      <div class="card-title">
        <h2>Contact Support</h2>
      </div>
      <div class="card-text">
        <p>If you have any issues or need assistance, contact us at <a href="mailto:medsupport@atozapp.com">medsupport@atozapp.com</a>.</p>
      </div>
    </div>
  </div>
  `,
}
