export default {
  name: "Skeleton",
  props: {
    type: { type: String, default: "table" },
    rows: { type: Number, default: 5 },
    cols: { type: Number, default: 9 },
  },

  template: `
  <div class="skeleton-wrapper">

    <!-- Table skeleton -->
    <div v-if="type === 'table'" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th v-for="c in cols" :key="c">
                <div class="skeleton-bar" style="width:60%"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r">
              <td v-for="c in cols" :key="c">
                <div class="skeleton-bar" :style="{ width: randomWidth(r + c) }"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card skeleton -->
    <div v-else-if="type === 'card'" class="row g-3">
      <div v-for="r in rows" :key="r" class="col-12 col-md-6 col-lg-4">
        <div class="card p-3">
          <div class="skeleton-bar mb-2" style="width:50%;height:18px"></div>
          <div class="skeleton-bar mb-1" style="width:80%"></div>
          <div class="skeleton-bar" style="width:65%"></div>
        </div>
      </div>
    </div>

    <!-- Generic line skeleton -->
    <div v-else>
      <div v-for="r in rows" :key="r" class="skeleton-bar mb-2"
           :style="{ width: randomWidth(r), height: '16px' }"></div>
    </div>

  </div>
  `,

  methods: {
    randomWidth(seed) {
      const widths = ["45%", "55%", "65%", "75%", "85%", "90%", "70%"];
      return widths[seed % widths.length];
    }
  }
};
