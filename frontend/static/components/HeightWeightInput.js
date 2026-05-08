// Smart height/weight input with auto-detection, unit conversion, and live BMI

const HW = {
  feetInchesToCm: (ft, inches) => (parseFloat(ft) * 12 + parseFloat(inches)) * 2.54,
  inchesToCm:     (inches) => parseFloat(inches) * 2.54,
  mToCm:          (m)      => parseFloat(m) * 100,
  lbsToKg:        (lbs)    => parseFloat(lbs) * 0.453592,
  kgToLbs:        (kg)     => parseFloat(kg) * 2.20462,
  cmToFtIn:       (cm) => {
    const totalIn = cm / 2.54;
    const ft      = Math.floor(totalIn / 12);
    const inches  = Math.round(totalIn % 12);
    return { ft, inches };
  }
};

export default {
  name: "HeightWeightInput",

  props: {
    heightCm: { type: Number, default: null },
    weightKg: { type: Number, default: null }
  },

  template: `
  <div>

    <!-- ═══ HEIGHT CARD ═══ -->
    <div class="card border-0 shadow-sm mb-3" style="border-radius:14px;overflow:hidden">
      <div class="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <span style="font-size:18px">📏</span>
          <span class="fw-semibold" style="font-size:14px">Height</span>
          <span v-if="parsedHeightCm" class="badge bg-success-subtle text-success px-2" style="font-size:11px">
            ✓ {{ parsedHeightCm.toFixed(1) }} cm
          </span>
        </div>
        <!-- Unit toggle -->
        <div class="d-flex gap-1 p-1 rounded-3" style="background:#f1f3f5">
          <button class="btn btn-sm px-3 fw-semibold"
                  style="border-radius:8px;font-size:12px;transition:all .2s;border:none"
                  :style="heightUnit==='cm' ? 'background:#0d6efd;color:white;box-shadow:0 2px 6px rgba(13,110,253,.3)' : 'background:transparent;color:#6c757d'"
                  @click="setHeightUnit('cm')">cm</button>
          <button class="btn btn-sm px-3 fw-semibold"
                  style="border-radius:8px;font-size:12px;transition:all .2s;border:none"
                  :style="heightUnit==='ft' ? 'background:#0d6efd;color:white;box-shadow:0 2px 6px rgba(13,110,253,.3)' : 'background:transparent;color:#6c757d'"
                  @click="setHeightUnit('ft')">ft / in</button>
        </div>
      </div>
      <div class="card-body px-3 py-3">

        <!-- CM mode -->
        <div v-if="heightUnit === 'cm'">
          <input v-model="heightRaw"
            class="form-control form-control-lg fw-semibold"
            :class="{ 'is-invalid': heightMsg && heightMsg.type==='error', 'border-success': parsedHeightCm && heightMsg && heightMsg.type==='ok' }"
            placeholder="e.g. 170 cm, 5'8, 68 inches, 1.75m"
            style="font-size:15px;border-radius:10px"
            @input="processHeight"
            @blur="processHeight" />

          <!-- Status row -->
          <div class="mt-2 d-flex align-items-center gap-2 flex-wrap" v-if="heightMsg || heightHint">
            <span v-if="heightMsg && heightMsg.type==='ok'" class="text-success" style="font-size:13px">
              ✓ {{ heightMsg.text }}
            </span>
            <span v-if="heightMsg && heightMsg.type==='ok' && heightHint" class="text-muted" style="font-size:12px">
              · {{ heightHint }}
            </span>
            <span v-if="heightMsg && heightMsg.type==='warning'" class="text-warning" style="font-size:13px">
              ⚠ {{ heightMsg.text }}
            </span>
            <span v-if="heightMsg && heightMsg.type==='error'" class="text-danger" style="font-size:13px">
              ✕ {{ heightMsg.text }}
            </span>
          </div>
          <div v-else class="form-text text-muted mt-1">
            Accepts: <code>170 cm</code> · <code>5'8</code> · <code>68 inches</code> · <code>1.75m</code>
          </div>
        </div>

        <!-- FT/IN mode -->
        <div v-if="heightUnit === 'ft'">
          <div class="d-flex align-items-end gap-2">
            <div style="flex:1">
              <div class="input-group">
                <input v-model.number="heightFt" type="number" min="0" max="9"
                  class="form-control form-control-lg fw-semibold text-center"
                  style="border-radius:10px 0 0 10px;font-size:18px"
                  placeholder="0"
                  @input="processFtIn" />
                <span class="input-group-text fw-semibold" style="border-radius:0 10px 10px 0;background:#f8f9fa;border-left:0">ft</span>
              </div>
            </div>
            <div class="fw-bold text-muted mb-2" style="font-size:22px">·</div>
            <div style="flex:1">
              <div class="input-group">
                <input v-model.number="heightIn" type="number" min="0" max="11"
                  class="form-control form-control-lg fw-semibold text-center"
                  style="border-radius:10px 0 0 10px;font-size:18px"
                  placeholder="0"
                  @input="processFtIn" />
                <span class="input-group-text fw-semibold" style="border-radius:0 10px 10px 0;background:#f8f9fa;border-left:0">in</span>
              </div>
            </div>
          </div>
          <div class="mt-2" style="font-size:13px">
            <span v-if="parsedHeightCm" class="text-success fw-semibold">
              ✓ {{ parsedHeightCm.toFixed(1) }} cm
            </span>
            <span v-else class="text-muted">Enter feet and inches (0–11)</span>
            <span v-if="heightMsg && heightMsg.type==='warning'" class="text-warning ms-2">⚠ {{ heightMsg.text }}</span>
          </div>
        </div>

        <!-- Suggestion banner -->
        <div v-if="heightSuggest" class="alert d-flex align-items-center justify-content-between mt-2 mb-0 py-2 px-3"
             style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;font-size:13px">
          <span>⚡ {{ heightSuggest.text }}</span>
          <div class="d-flex gap-1 ms-2 flex-shrink-0">
            <button class="btn btn-sm btn-warning text-dark fw-semibold" @click="acceptHeightSuggestion">Yes</button>
            <button class="btn btn-sm btn-outline-secondary" @click="heightSuggest=null">Keep</button>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══ WEIGHT CARD ═══ -->
    <div class="card border-0 shadow-sm mb-3" style="border-radius:14px;overflow:hidden">
      <div class="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <span style="font-size:18px">⚖️</span>
          <span class="fw-semibold" style="font-size:14px">Weight</span>
          <span v-if="parsedWeightKg" class="badge bg-success-subtle text-success px-2" style="font-size:11px">
            ✓ {{ parsedWeightKg.toFixed(1) }} kg
          </span>
        </div>
        <!-- Unit toggle -->
        <div class="d-flex gap-1 p-1 rounded-3" style="background:#f1f3f5">
          <button class="btn btn-sm px-3 fw-semibold"
                  style="border-radius:8px;font-size:12px;transition:all .2s;border:none"
                  :style="weightUnit==='kg' ? 'background:#0d6efd;color:white;box-shadow:0 2px 6px rgba(13,110,253,.3)' : 'background:transparent;color:#6c757d'"
                  @click="setWeightUnit('kg')">kg</button>
          <button class="btn btn-sm px-3 fw-semibold"
                  style="border-radius:8px;font-size:12px;transition:all .2s;border:none"
                  :style="weightUnit==='lbs' ? 'background:#0d6efd;color:white;box-shadow:0 2px 6px rgba(13,110,253,.3)' : 'background:transparent;color:#6c757d'"
                  @click="setWeightUnit('lbs')">lbs</button>
        </div>
      </div>
      <div class="card-body px-3 py-3">
        <div class="input-group">
          <span class="input-group-text fw-semibold" style="border-radius:10px 0 0 10px;background:#f8f9fa">
            {{ weightUnit === 'kg' ? 'kg' : 'lbs' }}
          </span>
          <input v-model="weightRaw"
            class="form-control form-control-lg fw-semibold"
            :class="{ 'is-invalid': weightMsg && weightMsg.type==='error' }"
            :placeholder="weightUnit === 'kg' ? 'e.g. 70 or 154 lbs' : 'e.g. 154 or 70 kg'"
            style="font-size:15px;border-radius:0 10px 10px 0"
            @input="processWeight"
            @blur="processWeight" />
        </div>

        <div class="mt-2 d-flex align-items-center gap-2 flex-wrap" v-if="weightMsg">
          <span v-if="weightMsg.type==='ok'" class="text-success" style="font-size:13px">
            ✓ {{ weightMsg.text }}
          </span>
          <span v-if="weightMsg.type==='ok' && weightHint" class="text-muted" style="font-size:12px">
            · {{ weightHint }}
          </span>
          <span v-if="weightMsg.type==='warning'" class="text-warning" style="font-size:13px">
            ⚠ {{ weightMsg.text }}
          </span>
          <span v-if="weightMsg.type==='error'" class="text-danger" style="font-size:13px">
            ✕ {{ weightMsg.text }}
          </span>
        </div>
        <div v-else class="form-text text-muted mt-1">
          Accepts: <code>70 kg</code> · <code>154 lbs</code> · <code>70</code> (kg assumed)
        </div>

        <!-- Suggestion -->
        <div v-if="weightSuggest" class="alert d-flex align-items-center justify-content-between mt-2 mb-0 py-2 px-3"
             style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;font-size:13px">
          <span>⚡ {{ weightSuggest.text }}</span>
          <div class="d-flex gap-1 ms-2 flex-shrink-0">
            <button class="btn btn-sm btn-warning text-dark fw-semibold" @click="acceptWeightSuggestion">Yes</button>
            <button class="btn btn-sm btn-outline-secondary" @click="weightSuggest=null">Keep</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ BMI CARD ═══ -->
    <div v-if="bmi" class="card border-0 shadow-sm mb-3" style="border-radius:14px;overflow:hidden">
      <div class="card-body p-0">
        <!-- BMI scale bar -->
        <div class="position-relative" style="height:8px;background:linear-gradient(to right,#3b82f6 0%,#22c55e 30%,#f59e0b 60%,#ef4444 100%)">
          <div class="position-absolute top-50 translate-middle"
               :style="{ left: bmiBarPct + '%' }"
               style="width:14px;height:14px;border-radius:50%;background:white;border:3px solid #333;transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,.3)">
          </div>
        </div>
        <div class="px-4 py-3">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600">Body Mass Index</div>
              <div class="fw-bold mt-1" style="font-size:32px;letter-spacing:-1px;line-height:1">{{ bmi }}</div>
            </div>
            <div class="text-end">
              <span class="badge px-3 py-2 fs-6" :class="bmiInfo.cls">
                {{ bmiInfo.icon }} {{ bmiInfo.label }}
              </span>
              <div class="text-muted mt-2" style="font-size:12px">
                <span v-if="parsedHeightCm">{{ parsedHeightCm.toFixed(1) }} cm</span>
                <span v-if="parsedHeightCm && parsedWeightKg"> · </span>
                <span v-if="parsedWeightKg">{{ parsedWeightKg.toFixed(1) }} kg</span>
              </div>
            </div>
          </div>
          <!-- BMI scale labels -->
          <div class="d-flex justify-content-between mt-2" style="font-size:10px;color:#9ca3af">
            <span>Underweight<br>&lt;18.5</span>
            <span class="text-center">Normal<br>18.5–25</span>
            <span class="text-center">Overweight<br>25–30</span>
            <span class="text-end">Obese<br>&gt;30</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty BMI state -->
    <div v-else class="text-center py-3 text-muted" style="font-size:13px">
      <span style="font-size:28px">📊</span>
      <div class="mt-1">Enter both height and weight to calculate BMI</div>
    </div>

  </div>
  `,

  data() {
    return {
      heightUnit: "cm",
      weightUnit: "kg",

      heightRaw: "",
      heightFt:  "",
      heightIn:  "",
      weightRaw: "",

      parsedHeightCm: null,
      parsedWeightKg: null,

      heightMsg:     null,
      weightMsg:     null,
      heightHint:    null,
      weightHint:    null,
      heightSuggest: null,
      weightSuggest: null
    };
  },

  computed: {
    bmi() {
      const h = this.parsedHeightCm;
      const w = this.parsedWeightKg;
      if (h && w && h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
      return null;
    },

    bmiInfo() {
      const b = parseFloat(this.bmi);
      if (!b) return {};
      if (b < 16)   return { label: "Severe Underweight", cls: "text-bg-danger",  icon: "🔴" };
      if (b < 18.5) return { label: "Underweight",        cls: "text-bg-warning", icon: "🟡" };
      if (b < 25)   return { label: "Normal Weight",      cls: "text-bg-success", icon: "🟢" };
      if (b < 30)   return { label: "Overweight",         cls: "text-bg-warning", icon: "🟡" };
      if (b < 35)   return { label: "Obese Class I",      cls: "text-bg-danger",  icon: "🔴" };
      return               { label: "Obese Class II+",    cls: "text-bg-danger",  icon: "🔴" };
    },

    bmiBarPct() {
      const b = parseFloat(this.bmi);
      if (!b) return 0;
      // Map BMI 15-40 → 0-100%
      return Math.min(100, Math.max(0, ((b - 15) / 25) * 100));
    }
  },

  watch: {
    heightCm(val) {
      if (val !== this.parsedHeightCm) this.initHeight(val);
    },
    weightKg(val) {
      if (val !== this.parsedWeightKg) this.initWeight(val);
    }
  },

  mounted() {
    if (this.heightCm) this.initHeight(this.heightCm);
    if (this.weightKg) this.initWeight(this.weightKg);
  },

  methods: {
    // ─── Init from parent prop (e.g., loading existing casepaper) ────
    initHeight(cm) {
      if (!cm) return;
      this.parsedHeightCm = cm;
      if (this.heightUnit === "cm") {
        this.heightRaw  = cm.toFixed(1);
        this.heightMsg  = { type: "ok", text: `${cm.toFixed(1)} cm` };
        this.heightHint = this.fmtFtIn(cm);
      } else {
        const { ft, inches } = HW.cmToFtIn(cm);
        this.heightFt = ft;
        this.heightIn = inches;
      }
    },

    initWeight(kg) {
      if (!kg) return;
      this.parsedWeightKg = kg;
      this.weightRaw = this.weightUnit === "kg" ? kg.toFixed(1) : HW.kgToLbs(kg).toFixed(1);
      this.weightMsg  = { type: "ok", text: `${kg.toFixed(1)} kg` };
      this.weightHint = `${HW.kgToLbs(kg).toFixed(1)} lbs`;
    },

    // ─── Height: CM mode ─────────────────────────────────────────────
    processHeight() {
      this.heightSuggest = null;
      this.heightMsg     = null;
      this.heightHint    = null;

      const raw = (this.heightRaw || "").trim();
      if (!raw) {
        this.parsedHeightCm = null;
        this.$emit("update:heightCm", null);
        return;
      }

      const r = this.parseHeightToCm(raw);

      if (r.error) {
        this.heightMsg      = { type: "error", text: r.error };
        this.parsedHeightCm = null;
        this.$emit("update:heightCm", null);
        return;
      }

      if (r.cm !== null && r.cm !== undefined) {
        this.parsedHeightCm = Math.round(r.cm * 10) / 10;

        if (r.suggestion) {
          this.heightSuggest = r.suggestion;
          // Still show the current parsed value while user decides
          this.heightMsg = { type: "warning", text: `Parsed as ${this.parsedHeightCm.toFixed(1)} cm — see suggestion below.` };
        } else if (this.parsedHeightCm < 40) {
          this.heightMsg = { type: "warning", text: `${this.parsedHeightCm.toFixed(1)} cm — unusually small. Please verify.` };
          this.$emit("update:heightCm", this.parsedHeightCm);
        } else if (this.parsedHeightCm > 250) {
          this.heightMsg = { type: "warning", text: `${this.parsedHeightCm.toFixed(1)} cm — unusually large. Please verify.` };
          this.$emit("update:heightCm", this.parsedHeightCm);
        } else {
          this.heightMsg  = { type: "ok", text: `${this.parsedHeightCm.toFixed(1)} cm` };
          this.heightHint = this.fmtFtIn(this.parsedHeightCm);
          this.$emit("update:heightCm", this.parsedHeightCm);
        }
      }
    },

    // ─── Height: FT/IN mode ──────────────────────────────────────────
    processFtIn() {
      const ft     = parseFloat(this.heightFt) || 0;
      const inches = parseFloat(this.heightIn) || 0;
      this.heightMsg = null;

      if (!ft && !inches) {
        this.parsedHeightCm = null;
        this.$emit("update:heightCm", null);
        return;
      }
      if (inches > 11) {
        this.heightMsg = { type: "warning", text: "Inches must be 0–11." };
        return;
      }
      const cm = HW.feetInchesToCm(ft, inches);
      this.parsedHeightCm = Math.round(cm * 10) / 10;
      this.heightMsg = { type: "ok", text: `${ft}′${inches}″ = ${this.parsedHeightCm.toFixed(1)} cm` };
      this.$emit("update:heightCm", this.parsedHeightCm);
    },

    // ─── Weight ──────────────────────────────────────────────────────
    processWeight() {
      this.weightSuggest = null;
      this.weightMsg     = null;
      this.weightHint    = null;

      const raw = (this.weightRaw || "").trim();
      if (!raw) {
        this.parsedWeightKg = null;
        this.$emit("update:weightKg", null);
        return;
      }

      const r = this.parseWeightToKg(raw);

      if (r.error) {
        this.weightMsg      = { type: "error", text: r.error };
        this.parsedWeightKg = null;
        this.$emit("update:weightKg", null);
        return;
      }

      if (r.kg !== null && r.kg !== undefined) {
        this.parsedWeightKg = Math.round(r.kg * 10) / 10;

        if (r.suggestion) {
          this.weightSuggest = r.suggestion;
          this.weightMsg = { type: "warning", text: `Parsed as ${this.parsedWeightKg.toFixed(1)} kg — see suggestion below.` };
        } else if (this.parsedWeightKg < 1) {
          this.weightMsg = { type: "warning", text: `${this.parsedWeightKg.toFixed(1)} kg — unusually low. Please verify.` };
          this.$emit("update:weightKg", this.parsedWeightKg);
        } else if (this.parsedWeightKg > 400) {
          this.weightMsg = { type: "warning", text: `${this.parsedWeightKg.toFixed(1)} kg — unusually high. Please verify.` };
          this.$emit("update:weightKg", this.parsedWeightKg);
        } else {
          this.weightMsg  = { type: "ok", text: `${this.parsedWeightKg.toFixed(1)} kg` };
          this.weightHint = `${HW.kgToLbs(this.parsedWeightKg).toFixed(1)} lbs`;
          this.$emit("update:weightKg", this.parsedWeightKg);
        }
      }
    },

    // ─── Parser: Height → cm ─────────────────────────────────────────
    parseHeightToCm(s) {
      // Explicit cm: 170cm, 170 cm
      let m = s.match(/^(\d+(?:\.\d+)?)\s*cm$/i);
      if (m) return { cm: parseFloat(m[1]) };

      // Meters: 1.7m, 1.75 m (not cm)
      m = s.match(/^(\d+(?:\.\d+)?)\s*m(?!m|\w)/i);
      if (m) return { cm: HW.mToCm(m[1]) };

      // Inches only: 68in, 68 inches, 68"
      m = s.match(/^(\d+(?:\.\d+)?)\s*(?:"″|in(?:ches?)?)$/i);
      if (m) return { cm: HW.inchesToCm(m[1]) };

      // Feet-inches patterns: 5'8, 5'8", 5ft8, 5ft8in, 5 feet 8 inches, 5 feet 8
      m = s.match(/^(\d+(?:\.\d+)?)\s*(?:[''′`]|ft|feet?|foot)\s*(\d+(?:\.\d+)?)?\s*(?:["″]|in(?:ches?)?)?$/i);
      if (m) {
        const ft     = parseFloat(m[1]);
        const inches = parseFloat(m[2] || 0);
        if (inches > 11.9) return { error: `Inches value ${Math.round(inches)} is too high (max 11). Try: ${ft}′${inches % 12 | 0}″` };
        return { cm: HW.feetInchesToCm(ft, inches) };
      }

      // Pure number — smart interpretation
      const num = parseFloat(s);
      if (isNaN(num) || /[a-z]/i.test(s.replace(/[\d.'"\s]/g, ""))) {
        return { error: `Could not understand "${s}". Try: 170 cm · 5'8 · 68 inches · 1.75m` };
      }

      // FT unit mode: pure number = feet decimal
      if (this.heightUnit === "ft") return { cm: num * 30.48 };

      // CM mode smart rules:
      // 0.3–2.99 → likely meters (1.7 → 170 cm)
      if (num > 0.29 && num < 3.0) return { cm: num * 100 };

      // 3–7 integer → likely feet
      if (Number.isInteger(num) && num >= 3 && num <= 7) {
        const cm = num * 30.48;
        return { cm, suggestion: { text: `Did you mean ${num} feet = ${cm.toFixed(0)} cm?`, cm } };
      }

      // 40–250 → standard cm
      if (num >= 40 && num <= 250) return { cm: num };

      // 300–799 → feet-inches compound (e.g. 508 = 5′8″)
      if (num >= 300 && num <= 799) {
        const ft = Math.floor(num / 100);
        const inches = Math.round(num % 100);
        if (ft >= 3 && ft <= 7 && inches <= 11) {
          const cm = HW.feetInchesToCm(ft, inches);
          return { cm, suggestion: { text: `Did you mean ${ft}′${inches}″ = ${cm.toFixed(1)} cm?`, cm } };
        }
      }

      // 1000–2500 → likely millimetres (1700mm = 170cm)
      if (num >= 1000 && num <= 2500) {
        const cm = num / 10;
        return { cm, suggestion: { text: `Did you mean ${cm.toFixed(0)} cm? (${num} looks like millimetres)`, cm } };
      }

      if (num < 1)    return { error: "Height seems too small. Please verify." };
      if (num > 2500) return { error: `${num} is outside any realistic height range.` };

      // Fall-through: accept with warning via medical check in processHeight
      return { cm: num };
    },

    // ─── Parser: Weight → kg ─────────────────────────────────────────
    parseWeightToKg(s) {
      // Explicit kg: 70kg, 70 kg
      let m = s.match(/^(\d+(?:\.\d+)?)\s*kg$/i);
      if (m) return { kg: parseFloat(m[1]) };

      // Explicit lbs/pounds: 154lbs, 154 lb, 154 pounds
      m = s.match(/^(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)$/i);
      if (m) return { kg: HW.lbsToKg(m[1]) };

      // Pure number
      const num = parseFloat(s);
      if (isNaN(num) || /[a-z]/i.test(s.replace(/[\d.\s]/g, ""))) {
        return { error: `Could not understand "${s}". Try: 70 kg or 154 lbs` };
      }
      if (num < 0) return { error: "Weight cannot be negative." };

      // LBS unit mode
      if (this.weightUnit === "lbs") return { kg: HW.lbsToKg(num) };

      // KG mode smart rules:
      if (num < 1)   return { error: `${num} kg is too low. Please verify.` };
      if (num <= 200) return { kg: num };

      // 201–450: might be lbs (common mistake)
      if (num > 200 && num <= 450) {
        const asLbs = HW.lbsToKg(num);
        return {
          kg: num,
          suggestion: {
            text: `${num} kg is very high. Could this be ${num} lbs = ${asLbs.toFixed(1)} kg?`,
            kg: asLbs
          }
        };
      }

      // >450: likely a typo (700 → 70)
      if (num > 450 && num <= 2000) {
        const likely = num / 10;
        if (likely >= 20 && likely <= 300) {
          return { kg: likely, suggestion: { text: `Did you mean ${likely.toFixed(0)} kg?`, kg: likely } };
        }
      }

      return { error: `${num} kg is outside realistic range. Please verify.` };
    },

    // ─── Unit toggle ──────────────────────────────────────────────────
    setHeightUnit(unit) {
      if (this.heightUnit === unit) return;
      this.heightUnit    = unit;
      this.heightSuggest = null;
      this.heightMsg     = null;
      this.heightHint    = null;

      if (unit === "ft" && this.parsedHeightCm) {
        const { ft, inches } = HW.cmToFtIn(this.parsedHeightCm);
        this.heightFt  = ft;
        this.heightIn  = inches;
        this.heightMsg = { type: "ok", text: `${ft}′${inches}″ = ${this.parsedHeightCm.toFixed(1)} cm` };
      } else if (unit === "cm" && this.parsedHeightCm) {
        this.heightRaw  = this.parsedHeightCm.toFixed(1);
        this.heightMsg  = { type: "ok", text: `${this.parsedHeightCm.toFixed(1)} cm` };
        this.heightHint = this.fmtFtIn(this.parsedHeightCm);
      } else {
        this.heightRaw = "";
        this.heightFt  = "";
        this.heightIn  = "";
      }
    },

    setWeightUnit(unit) {
      if (this.weightUnit === unit) return;
      this.weightUnit    = unit;
      this.weightSuggest = null;
      this.weightMsg     = null;
      this.weightHint    = null;

      if (this.parsedWeightKg) {
        if (unit === "lbs") {
          const lbs      = HW.kgToLbs(this.parsedWeightKg);
          this.weightRaw = lbs.toFixed(1);
          this.weightMsg = { type: "ok", text: `${lbs.toFixed(1)} lbs = ${this.parsedWeightKg.toFixed(1)} kg` };
        } else {
          this.weightRaw  = this.parsedWeightKg.toFixed(1);
          this.weightMsg  = { type: "ok", text: `${this.parsedWeightKg.toFixed(1)} kg` };
          this.weightHint = `${HW.kgToLbs(this.parsedWeightKg).toFixed(1)} lbs`;
        }
      } else {
        this.weightRaw = "";
      }
    },

    // ─── Accept suggestion ────────────────────────────────────────────
    acceptHeightSuggestion() {
      if (!this.heightSuggest?.cm) { this.heightSuggest = null; return; }
      this.parsedHeightCm = Math.round(this.heightSuggest.cm * 10) / 10;
      this.heightRaw      = this.parsedHeightCm.toFixed(1);
      this.heightMsg      = { type: "ok", text: `${this.parsedHeightCm.toFixed(1)} cm` };
      this.heightHint     = this.fmtFtIn(this.parsedHeightCm);
      this.heightSuggest  = null;
      this.$emit("update:heightCm", this.parsedHeightCm);
    },

    acceptWeightSuggestion() {
      if (!this.weightSuggest?.kg) { this.weightSuggest = null; return; }
      this.parsedWeightKg = Math.round(this.weightSuggest.kg * 10) / 10;
      this.weightRaw      = this.parsedWeightKg.toFixed(1);
      this.weightMsg      = { type: "ok", text: `${this.parsedWeightKg.toFixed(1)} kg` };
      this.weightHint     = `${HW.kgToLbs(this.parsedWeightKg).toFixed(1)} lbs`;
      this.weightSuggest  = null;
      this.$emit("update:weightKg", this.parsedWeightKg);
    },

    // ─── Helpers ──────────────────────────────────────────────────────
    fmtFtIn(cm) {
      const { ft, inches } = HW.cmToFtIn(cm);
      return `${ft}′${inches}″`;
    }
  }
};
