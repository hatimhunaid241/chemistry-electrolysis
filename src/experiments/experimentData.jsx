import React from 'react'
import MoltenPbBr2Sim from '../simulations/MoltenPbBr2'
import CuSO4Sim from '../simulations/CuSO4Sim'
import BrineSim from '../simulations/BrineSim'
import H2SO4Sim from '../simulations/H2SO4Sim'
import VoltaicCellSim from '../simulations/VoltaicCell'
import DanielCell from '../simulations/DanielCell'
import ElectroplatingSim from '../simulations/Electroplating'
import FuelCellSim from '../simulations/FuelCell'
import ConductivityTester from '../simulations/ConductivityTester'
import FaradayLab from '../simulations/FaradayLab'
import DischargePredictor from '../simulations/DischargePredictor'

// ---- randomisation helpers -------------------------------------------------
const R = (arr) => arr[Math.floor(Math.random() * arr.length)]
const F = 96500
const mcq = (question, options, answer, explanation) => ({ question, options, answer, explanation })

// Faraday first-law question: mass/volume from I and t. Difficulty controls
// how friendly the numbers are and whether it is single- or multi-step.
function qFaraday(pct) {
  const easy = pct <= 40, hard = pct >= 70
  const sp = R([
    { n: { en: 'copper', zh: '銅' }, M: 63.5, z: 2, gas: false },
    { n: { en: 'silver', zh: '銀' }, M: 108, z: 1, gas: false },
    hard ? { n: { en: 'hydrogen gas', zh: '氫氣' }, M: 2, z: 2, gas: true } : { n: { en: 'copper', zh: '銅' }, M: 63.5, z: 2, gas: false },
  ])
  const I = easy ? R([1, 2, 5]) : +(1 + Math.random() * 4).toFixed(1)
  const min = easy ? R([10, 20, 30]) : R([13, 17, 24, 32])
  const tSec = min * 60
  const Q = I * tSec
  const n = Q / F / sp.z
  const val = sp.gas ? n * 24 : n * sp.M
  const unit = sp.gas ? 'L' : 'g'
  const ans = +val.toFixed(sp.gas ? 3 : 3)
  const opts = shuffleWithAnswer([ans, +(ans * sp.z).toFixed(3), +(ans / 2).toFixed(3), +(ans * 1.5).toFixed(3)], ans)
  return mcq(
    { en: `A current of ${I} A is passed for ${min} min, depositing ${sp.n.en}. Using F = 96 500 C mol⁻¹${sp.gas ? ' and 24 L mol⁻¹' : ''}, find the ${sp.gas ? 'volume' : 'mass'} produced.`,
      zh: `以 ${I} A 電流通電 ${min} 分鐘析出${sp.n.zh}。用 F = 96 500 C mol⁻¹${sp.gas ? ' 及 24 L mol⁻¹' : ''}，求生成的${sp.gas ? '體積' : '質量'}。` },
    opts.map(o => ({ en: `${o} ${unit}`, zh: `${o} ${unit}` })),
    opts.indexOf(ans),
    { en: `Q = ${I}×${tSec} = ${Q} C; n(e⁻) = ${(Q / F).toFixed(4)} mol; n = n(e⁻)/${sp.z} = ${n.toFixed(4)} mol; answer = ${ans} ${unit}.`,
      zh: `Q = ${I}×${tSec} = ${Q} C；n(e⁻) = ${(Q / F).toFixed(4)} mol；n = n(e⁻)/${sp.z} = ${n.toFixed(4)} mol；答案 = ${ans} ${unit}。` },
  )
}
function qFaradayConcept(pct) {
  const hard = pct >= 70
  return hard
    ? mcq(
      { en: 'The same charge is passed through separate cells of AgNO₃ and CuSO₄. How does the mole ratio of Ag to Cu deposited compare?', zh: '相同電荷分別通過 AgNO₃ 及 CuSO₄ 電池。析出的 Ag 與 Cu 的摩爾比為何？' },
      [{ en: 'n(Ag) : n(Cu) = 2 : 1', zh: 'n(Ag) : n(Cu) = 2 : 1' }, { en: '1 : 1', zh: '1 : 1' }, { en: '1 : 2', zh: '1 : 2' }],
      0,
      { en: 'Ag⁺ needs 1 e⁻ but Cu²⁺ needs 2 e⁻, so equal charge gives twice as many moles of Ag.', zh: 'Ag⁺ 需 1 個 e⁻ 而 Cu²⁺ 需 2 個，故相同電荷析出的 Ag 摩爾數為 Cu 的兩倍。' })
    : mcq(
      { en: 'Faraday\'s first law states the mass deposited is proportional to:', zh: '法拉第第一定律指出沉積質量與甚麼成正比？' },
      [{ en: 'the quantity of charge passed', zh: '通過的電荷量' }, { en: 'the voltage only', zh: '只是電壓' }, { en: 'the electrode area', zh: '電極面積' }],
      0,
      { en: 'Mass ∝ charge Q = I·t.', zh: '質量 ∝ 電荷 Q = I·t。' })
}

function qProduct(pct, { qEn, qZh, correct, distractors, why }) {
  const opts = shuffleWithAnswer([correct, ...distractors], correct)
  return mcq({ en: qEn, zh: qZh }, opts, opts.indexOf(correct), why)
}
function shuffleWithAnswer(arr, ans) {
  const uniq = [...new Set(arr)]
  for (let i = uniq.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[uniq[i], uniq[j]] = [uniq[j], uniq[i]] }
  if (!uniq.includes(ans)) uniq[0] = ans
  return uniq
}

// Simple bilingual product-option helper
const opt = (en, zh) => ({ en, zh })

export const EXPERIMENTS = [
  {
    id: 'conductivity', icon: '🔌',
    title: { en: 'Testing Electrical Conductivity', zh: '測試導電性' },
    desc: { en: 'Which substances conduct, and what carries the charge?', zh: '哪些物質導電？由甚麼載送電荷？' },
    tags: [{ en: 'Intro', zh: '導論' }, { en: 'Electrolytes', zh: '電解質' }],
    render: (onSample) => <ConductivityTester onSample={onSample} />,
    objective: { en: 'To classify substances as conductors or non-conductors and identify their charge carriers (mobile ions vs delocalised electrons).', zh: '把物質分類為導電體或非導電體，並辨認其載流子（可移動離子或離域電子）。' },
    variables: [{ en: 'Substance and its physical state', zh: '物質及其物理狀態' }, { en: 'Bulb brightness / ammeter reading (dependent)', zh: '燈泡亮度／安培計讀數（因變量）' }],
    steps: [
      { en: 'Place the sample between two inert electrodes in the circuit.', zh: '把樣本置於電路中兩惰性電極之間。' },
      { en: 'Switch on and observe whether the bulb lights.', zh: '開啟電源，觀察燈泡是否亮起。' },
      { en: 'Compare solids, melts, solutions and covalent liquids.', zh: '比較固體、熔體、溶液及共價液體。' },
    ],
    series: [{ key: 'current', label: { en: 'Current (A)', zh: '電流 (A)' }, color: '#2563eb' }],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.current != null
      ? { en: `The selected sample gives a current of ${s.current} A — ${+s.current > 0 ? 'it conducts, so mobile charge carriers are present.' : 'no current flows, so there are no mobile charge carriers.'}`, zh: `所選樣本電流為 ${s.current} A —— ${+s.current > 0 ? '能導電，表示存在可移動載流子。' : '沒有電流，表示沒有可移動載流子。'}` }
      : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'Which of these conducts electricity?', qZh: '下列哪項能導電？', correct: opt('Molten NaCl', '熔融 NaCl'), distractors: [opt('Solid NaCl', '固態 NaCl'), opt('Sugar solution', '糖溶液'), opt('Ethanol', '乙醇')], why: { en: 'Molten NaCl has mobile ions; the others have no mobile charge carriers.', zh: '熔融 NaCl 有可移動離子；其餘沒有可移動載流子。' } }),
      (pct) => pct >= 60
        ? mcq({ en: 'Copper and molten NaCl both conduct, but the charge carriers differ. In copper they are:', zh: '銅與熔融 NaCl 都導電，但載流子不同。銅中的載流子是：' }, [opt('delocalised electrons', '離域電子'), opt('mobile ions', '可移動離子'), opt('protons', '質子')], 0, { en: 'Metals conduct via a sea of delocalised electrons; electrolytes via mobile ions.', zh: '金屬靠離域電子海導電；電解質靠可移動離子。' })
        : mcq({ en: 'A liquid that does NOT conduct electricity is:', zh: '不導電的液體是：' }, [opt('Ethanol', '乙醇'), opt('Dilute HCl', '稀鹽酸'), opt('NaCl(aq)', 'NaCl(aq)')], 0, { en: 'Ethanol is covalent with no ions; the others contain mobile ions.', zh: '乙醇為共價、無離子；其餘含可移動離子。' }),
    ],
  },

  {
    id: 'molten', icon: '🔥',
    title: { en: 'Electrolysis of Molten PbBr₂', zh: '電解熔融 PbBr₂' },
    desc: { en: 'Animated Pb²⁺ and Br⁻ ions discharging at the electrodes.', zh: 'Pb²⁺ 與 Br⁻ 離子在電極放電的動畫。' },
    tags: [{ en: 'Molten', zh: '熔融' }],
    render: (onSample) => <MoltenPbBr2Sim onSample={onSample} />,
    objective: { en: 'To electrolyse a molten binary salt and identify the metal formed at the cathode and the non-metal at the anode.', zh: '電解熔融二元鹽，辨認陰極生成的金屬及陽極生成的非金屬。' },
    variables: [{ en: 'Voltage', zh: '電壓' }, { en: 'Temperature (must stay molten)', zh: '溫度（須保持熔融）' }, { en: 'Pb deposited / Br₂ evolved (dependent)', zh: '析出的 Pb／放出的 Br₂（因變量）' }],
    steps: [
      { en: 'Heat PbBr₂ until molten so the ions become mobile.', zh: '加熱 PbBr₂ 至熔融，使離子可移動。' },
      { en: 'Apply a DC voltage across two carbon electrodes.', zh: '在兩碳電極間施加直流電壓。' },
      { en: 'Observe grey Pb at the cathode and brown Br₂ at the anode.', zh: '觀察陰極的灰色 Pb 及陽極的棕色 Br₂。' },
    ],
    series: [
      { key: 'pb', label: { en: 'Pb deposited', zh: '析出 Pb' }, color: '#64748b' },
      { key: 'br2', label: { en: 'Br₂ evolved', zh: '放出 Br₂' }, color: '#7c3aed' },
    ],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.pb != null ? { en: `After ${s.t}s, ${s.pb} units of Pb have been deposited at the cathode and ${s.br2} units of Br₂ released at the anode — roughly a 1:1 mole ratio, as PbBr₂ → Pb + Br₂.`, zh: `${s.t} 秒後，陰極析出 ${s.pb} 單位 Pb，陽極放出 ${s.br2} 單位 Br₂ —— 約 1:1 摩爾比，符合 PbBr₂ → Pb + Br₂。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'What is produced at the anode?', qZh: '陽極生成甚麼？', correct: opt('Bromine (Br₂)', '溴 (Br₂)'), distractors: [opt('Lead', '鉛'), opt('Oxygen', '氧'), opt('Hydrogen', '氫')], why: { en: '2Br⁻ → Br₂ + 2e⁻ (oxidation of the anion).', zh: '2Br⁻ → Br₂ + 2e⁻（陰離子氧化）。' } }),
      (pct) => pct >= 60
        ? mcq({ en: 'Write the cathode half-equation.', zh: '寫出陰極半反應方程式。' }, [opt('Pb²⁺ + 2e⁻ → Pb', 'Pb²⁺ + 2e⁻ → Pb'), opt('Pb → Pb²⁺ + 2e⁻', 'Pb → Pb²⁺ + 2e⁻'), opt('2Br⁻ → Br₂ + 2e⁻', '2Br⁻ → Br₂ + 2e⁻')], 0, { en: 'Reduction of Pb²⁺ at the cathode.', zh: '陰極還原 Pb²⁺。' })
        : mcq({ en: 'Why must the PbBr₂ be molten?', zh: '為何 PbBr₂ 必須熔融？' }, [opt('So the ions can move', '使離子能移動'), opt('To cool the cell', '為冷卻電池'), opt('To add water', '為加入水')], 0, { en: 'Only mobile ions can carry charge and be discharged.', zh: '只有可移動離子才能傳電並放電。' }),
    ],
  },

  {
    id: 'cuso4_inert', icon: '🔵',
    title: { en: 'CuSO₄ with Inert Electrodes', zh: 'CuSO₄（惰性電極）' },
    desc: { en: 'Cu deposits at the cathode; O₂ evolves at the anode.', zh: '陰極沉積 Cu；陽極放出 O₂。' },
    tags: [{ en: 'Aqueous', zh: '水溶液' }, { en: 'Inert', zh: '惰性' }],
    render: (onSample) => <CuSO4Sim activeElectrodes={false} onSample={onSample} />,
    objective: { en: 'To electrolyse aqueous CuSO₄ with carbon electrodes and account for the products using preferential discharge.', zh: '以碳電極電解 CuSO₄(aq)，並以優先放電解釋產物。' },
    variables: [{ en: 'Voltage', zh: '電壓' }, { en: 'CuSO₄ concentration', zh: 'CuSO₄ 濃度' }, { en: 'Cu deposited / O₂ evolved (dependent)', zh: '析出 Cu／放出 O₂（因變量）' }],
    steps: [
      { en: 'Dip two carbon rods into CuSO₄(aq).', zh: '把兩碳棒浸入 CuSO₄(aq)。' },
      { en: 'Apply a DC voltage and start the timer.', zh: '施加直流電壓並開始計時。' },
      { en: 'Note Cu on the cathode, O₂ at the anode and the fading blue colour.', zh: '記錄陰極的 Cu、陽極的 O₂ 及褪色的藍色。' },
    ],
    series: [
      { key: 'cu', label: { en: 'Cu deposited', zh: '析出 Cu' }, color: '#b45309' },
      { key: 'o2', label: { en: 'O₂ evolved', zh: '放出 O₂' }, color: '#0ea5e9' },
    ],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.cu != null ? { en: `Copper builds up on the cathode (${s.cu} units) while O₂ is released at the inert anode (${s.o2} units). The blue colour fades as Cu²⁺ is removed and the solution turns acidic.`, zh: `陰極銅逐漸增加（${s.cu} 單位），惰性陽極放出 O₂（${s.o2} 單位）。隨 Cu²⁺ 被移除，藍色變淡，溶液變酸性。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'With inert electrodes, the anode product is:', qZh: '用惰性電極時，陽極產物是：', correct: opt('Oxygen', '氧'), distractors: [opt('Copper', '銅'), opt('Hydrogen', '氫'), opt('Sulfur', '硫')], why: { en: 'SO₄²⁻ is not discharged; water is oxidised: 2H₂O → O₂ + 4H⁺ + 4e⁻.', zh: 'SO₄²⁻ 不放電；水被氧化：2H₂O → O₂ + 4H⁺ + 4e⁻。' } }),
      (pct) => mcq({ en: 'Why does the blue colour fade?', zh: '為何藍色會變淡？' }, [opt('Cu²⁺ is removed at the cathode', 'Cu²⁺ 在陰極被移除'), opt('SO₄²⁻ is discharged', 'SO₄²⁻ 放電'), opt('Water evaporates', '水蒸發')], 0, { en: 'Blue is due to Cu²⁺; it is reduced to Cu and deposited.', zh: '藍色源自 Cu²⁺；它被還原成 Cu 並沉積。' }),
    ],
  },

  {
    id: 'cuso4_active', icon: '🟠',
    title: { en: 'CuSO₄ with Active Cu Electrodes', zh: 'CuSO₄（活性銅電極）' },
    desc: { en: 'Anode dissolves, pure Cu deposits — copper refining.', zh: '陽極溶解、純銅沉積 —— 銅的精煉。' },
    tags: [{ en: 'Active', zh: '活性' }, { en: 'Refining', zh: '精煉' }],
    render: (onSample) => <CuSO4Sim activeElectrodes={true} onSample={onSample} />,
    objective: { en: 'To show that an active copper anode dissolves while pure copper deposits, keeping [Cu²⁺] constant — the basis of copper purification.', zh: '展示活性銅陽極溶解、純銅沉積，[Cu²⁺] 保持不變 —— 銅精煉的基礎。' },
    variables: [{ en: 'Voltage', zh: '電壓' }, { en: 'Anode mass (decreases)', zh: '陽極質量（減少）' }, { en: 'Cathode deposit (increases)', zh: '陰極沉積（增加）' }],
    steps: [
      { en: 'Use an impure copper anode and a pure copper cathode.', zh: '用不純銅作陽極、純銅作陰極。' },
      { en: 'Electrolyse CuSO₄(aq) and track the electrode masses.', zh: '電解 CuSO₄(aq) 並追蹤電極質量。' },
      { en: 'Note the anode dissolving and pure Cu depositing.', zh: '觀察陽極溶解及純 Cu 沉積。' },
    ],
    series: [
      { key: 'cu', label: { en: 'Cu deposited', zh: '析出 Cu' }, color: '#b45309' },
      { key: 'anode', label: { en: 'Anode mass', zh: '陽極質量' }, color: '#0ea5e9' },
    ],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.cu != null ? { en: `The anode mass has fallen to ${s.anode}% while the cathode gains copper. Because the anode replenishes Cu²⁺ as fast as the cathode removes it, [Cu²⁺] stays essentially constant.`, zh: `陽極質量降至 ${s.anode}%，陰極則獲得銅。由於陽極補充 Cu²⁺ 的速率與陰極移除的速率相若，[Cu²⁺] 基本保持不變。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'With an active Cu anode, the anode reaction is:', qZh: '用活性銅陽極時，陽極反應是：', correct: opt('Cu → Cu²⁺ + 2e⁻', 'Cu → Cu²⁺ + 2e⁻'), distractors: [opt('2H₂O → O₂ + 4H⁺ + 4e⁻', '2H₂O → O₂ + 4H⁺ + 4e⁻'), opt('Cu²⁺ + 2e⁻ → Cu', 'Cu²⁺ + 2e⁻ → Cu')], why: { en: 'The copper anode dissolves in preference to water being oxidised.', zh: '銅陽極溶解，優先於氧化水。' } }),
      (pct) => mcq({ en: 'During copper refining, where do Ag and Au impurities go?', zh: '銅精煉時，Ag 和 Au 雜質往哪裡去？' }, [opt('Fall as anode slime', '沉落成陽極泥'), opt('Deposit on the cathode', '沉積於陰極'), opt('Escape as gas', '以氣體逸出')], 0, { en: 'Being less reactive than Cu, they are not oxidised and collect as anode slime.', zh: '它們較 Cu 不活潑，不被氧化，聚成陽極泥。' }),
    ],
  },

  {
    id: 'brine', icon: '🟢',
    title: { en: 'Electrolysis of Brine', zh: '電解鹽水' },
    desc: { en: 'Concentration switches the anode product from Cl₂ to O₂.', zh: '濃度使陽極產物由 Cl₂ 變 O₂。' },
    tags: [{ en: 'Brine', zh: '鹽水' }, { en: 'Concentration', zh: '濃度' }],
    render: (onSample) => <BrineSim onSample={onSample} />,
    objective: { en: 'To electrolyse NaCl(aq) and show how concentration determines whether Cl₂ or O₂ forms at the anode (the chlor-alkali process).', zh: '電解 NaCl(aq)，展示濃度如何決定陽極生成 Cl₂ 或 O₂（氯鹼法）。' },
    variables: [{ en: 'Voltage', zh: '電壓' }, { en: 'NaCl concentration', zh: 'NaCl 濃度' }, { en: 'Gas produced at each electrode (dependent)', zh: '各電極產生的氣體（因變量）' }],
    steps: [
      { en: 'Electrolyse NaCl(aq) with inert electrodes.', zh: '以惰性電極電解 NaCl(aq)。' },
      { en: 'Vary the NaCl concentration from dilute to concentrated.', zh: '把 NaCl 濃度由稀變濃。' },
      { en: 'Identify H₂ at the cathode and Cl₂ / O₂ at the anode.', zh: '辨認陰極的 H₂ 及陽極的 Cl₂／O₂。' },
    ],
    series: [
      { key: 'h2', label: { en: 'H₂ (cathode)', zh: 'H₂（陰極）' }, color: '#2563eb' },
      { key: 'anode', label: { en: 'Anode gas', zh: '陽極氣體' }, color: '#16a34a' },
      { key: 'naoh', label: { en: 'NaOH formed', zh: '生成 NaOH' }, color: '#ef4444' },
    ],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.h2 != null ? { en: `H₂ forms at the cathode leaving NaOH in solution. At the anode, the product depends on concentration — concentrated brine gives Cl₂, dilute brine gives O₂.`, zh: `陰極生成 H₂，溶液中留下 NaOH。陽極產物取決於濃度 —— 濃鹽水放 Cl₂，稀鹽水放 O₂。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'Electrolysis of CONCENTRATED brine gives which anode product?', qZh: '電解濃鹽水時陽極產物是：', correct: opt('Chlorine', '氯'), distractors: [opt('Oxygen', '氧'), opt('Hydrogen', '氫'), opt('Sodium', '鈉')], why: { en: 'High [Cl⁻] → 2Cl⁻ → Cl₂ + 2e⁻.', zh: '高 [Cl⁻] → 2Cl⁻ → Cl₂ + 2e⁻。' } }),
      (pct) => mcq({ en: 'The alkali left in solution after brine electrolysis is:', zh: '電解鹽水後留在溶液中的鹼是：' }, [opt('NaOH', 'NaOH'), opt('HCl', 'HCl'), opt('NaCl', 'NaCl')], 0, { en: 'Na⁺ stays with the OH⁻ produced at the cathode, giving NaOH.', zh: 'Na⁺ 與陰極生成的 OH⁻ 結合成 NaOH。' }),
    ],
  },

  {
    id: 'h2so4', icon: '⚗️',
    title: { en: 'Hoffman Voltameter (H₂SO₄)', zh: '霍夫曼電解器 (H₂SO₄)' },
    desc: { en: 'Watch the 2:1 H₂:O₂ volume ratio build up.', zh: '觀察 2:1 的 H₂:O₂ 體積比形成。' },
    tags: [{ en: 'Gas ratio', zh: '氣體比' }],
    render: (onSample) => <H2SO4Sim onSample={onSample} />,
    objective: { en: 'To electrolyse dilute H₂SO₄ and confirm the 2:1 volume ratio of hydrogen to oxygen (electrolysis of water).', zh: '電解稀 H₂SO₄，確認氫與氧 2:1 的體積比（電解水）。' },
    variables: [{ en: 'Voltage', zh: '電壓' }, { en: 'H₂ and O₂ volumes (dependent)', zh: 'H₂ 及 O₂ 體積（因變量）' }],
    steps: [
      { en: 'Fill both tubes of the voltameter with dilute H₂SO₄.', zh: '把電解器兩管注滿稀 H₂SO₄。' },
      { en: 'Electrolyse with platinum electrodes.', zh: '以鉑電極電解。' },
      { en: 'Compare the gas volumes collected in each tube.', zh: '比較各管收集的氣體體積。' },
    ],
    series: [
      { key: 'h2', label: { en: 'H₂ volume', zh: 'H₂ 體積' }, color: '#2563eb' },
      { key: 'o2', label: { en: 'O₂ volume', zh: 'O₂ 體積' }, color: '#ea580c' },
    ],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.h2 != null ? { en: `The cathode tube (H₂) fills about twice as fast as the anode tube (O₂), confirming H₂ : O₂ ≈ 2 : 1 — the water-splitting stoichiometry 2H₂O → 2H₂ + O₂.`, zh: `陰極管（H₂）充氣速率約為陽極管（O₂）的兩倍，確認 H₂ : O₂ ≈ 2 : 1 —— 即分解水的化學計量 2H₂O → 2H₂ + O₂。` } : null,
    questions: [
      (pct) => mcq({ en: 'The volume ratio of H₂ to O₂ collected is:', zh: '收集的 H₂ 與 O₂ 的體積比是：' }, [opt('2 : 1', '2 : 1'), opt('1 : 2', '1 : 2'), opt('1 : 1', '1 : 1')], 0, { en: '2H₂O → 2H₂ + O₂: twice as many moles (and volume) of H₂.', zh: '2H₂O → 2H₂ + O₂：H₂ 的摩爾數（及體積）是兩倍。' }),
      (pct) => qProduct(pct, { qEn: 'The gas at the cathode is:', qZh: '陰極的氣體是：', correct: opt('Hydrogen', '氫'), distractors: [opt('Oxygen', '氧'), opt('Chlorine', '氯'), opt('SO₂', 'SO₂')], why: { en: '2H⁺ + 2e⁻ → H₂ at the cathode.', zh: '陰極 2H⁺ + 2e⁻ → H₂。' } }),
    ],
  },

  {
    id: 'faraday', icon: '📐',
    title: { en: "Faraday's Laws (Quantitative)", zh: '法拉第定律（定量）' },
    desc: { en: 'Vary I and t; see mass ∝ charge in real time.', zh: '改變 I 與 t；即時觀察質量 ∝ 電荷。' },
    tags: [{ en: 'Calculation', zh: '計算' }, { en: 'Faraday', zh: '法拉第' }],
    render: (onSample) => <FaradayLab onSample={onSample} />,
    objective: { en: 'To verify Faraday\'s first law — the amount discharged is directly proportional to the charge Q = I·t.', zh: '驗證法拉第第一定律 —— 放電量與電荷 Q = I·t 成正比。' },
    variables: [{ en: 'Current I', zh: '電流 I' }, { en: 'Time t', zh: '時間 t' }, { en: 'Species (M, z)', zh: '物種 (M, z)' }, { en: 'Amount deposited (dependent)', zh: '沉積量（因變量）' }],
    steps: [
      { en: 'Choose the species being discharged and set the current.', zh: '選擇被放電的物種並設定電流。' },
      { en: 'Run the cell; the panel computes Q, n(e⁻), n and mass/volume live.', zh: '運行電池；面板即時計算 Q、n(e⁻)、n 及質量／體積。' },
      { en: 'Confirm the amount is proportional to time (constant I).', zh: '確認在固定 I 下，沉積量與時間成正比。' },
    ],
    series: [{ key: 'amount', label: { en: 'Amount (g or L)', zh: '沉積量 (g 或 L)' }, color: '#16a34a' }],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.amount != null ? { en: `Charge passed Q = ${s.charge} C corresponds to ${s.moles} mol discharged (${s.amount} g or L). The straight-line graph confirms amount ∝ charge (Faraday's first law).`, zh: `通過電荷 Q = ${s.charge} C，對應放電 ${s.moles} mol（${s.amount} g 或 L）。直線圖確認沉積量 ∝ 電荷（法拉第第一定律）。` } : null,
    questions: [qFaraday, qFaradayConcept, qFaraday],
  },

  {
    id: 'discharge', icon: '⚖️',
    title: { en: 'Preferential Discharge Predictor', zh: '優先放電預測器' },
    desc: { en: 'Pick ions, concentration and electrode; predict the products.', zh: '選擇離子、濃度及電極；預測產物。' },
    tags: [{ en: 'Factors', zh: '因素' }, { en: 'E-series', zh: '電化學序' }],
    render: () => <DischargePredictor />,
    objective: { en: 'To predict electrolysis products from the electrochemical series, ion concentration and electrode type.', zh: '根據電化學序、離子濃度及電極類型預測電解產物。' },
    variables: [{ en: 'Cation and anion present', zh: '存在的陽離子及陰離子' }, { en: 'Concentration', zh: '濃度' }, { en: 'Electrode (inert / active)', zh: '電極（惰性／活性）' }],
    steps: [
      { en: 'Select the cation and anion in the electrolyte.', zh: '選擇電解質中的陽離子及陰離子。' },
      { en: 'Set the concentration and electrode type.', zh: '設定濃度及電極類型。' },
      { en: 'Read off the predicted cathode and anode products and the reasoning.', zh: '讀出預測的陰極及陽極產物及其推理。' },
    ],
    series: null,
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: () => ({ en: 'Cathode: the most easily reduced cation is discharged (noble metals deposit; reactive-metal ions leave H₂ from water). Anode: a concentrated halide gives the halogen, otherwise water is oxidised to O₂ — unless an active electrode dissolves instead.', zh: '陰極：最易還原的陽離子放電（貴金屬沉積；活潑金屬離子則由水生成 H₂）。陽極：濃鹵離子生成鹵素，否則氧化水生成 O₂ —— 除非活性電極自身溶解。' }),
    questions: [
      (pct) => qProduct(pct, { qEn: 'Dilute Na₂SO₄ with inert electrodes: the cathode product is:', qZh: '以惰性電極電解稀 Na₂SO₄：陰極產物是：', correct: opt('Hydrogen', '氫'), distractors: [opt('Sodium', '鈉'), opt('Oxygen', '氧'), opt('Sulfur', '硫')], why: { en: 'Na⁺ is too reactive, so water is reduced: 2H₂O + 2e⁻ → H₂ + 2OH⁻.', zh: 'Na⁺ 太活潑，水被還原：2H₂O + 2e⁻ → H₂ + 2OH⁻。' } }),
      (pct) => pct >= 60
        ? mcq({ en: 'Concentrated KI is electrolysed with carbon electrodes. The anode product is:', zh: '以碳電極電解濃 KI，陽極產物是：' }, [opt('Iodine', '碘'), opt('Oxygen', '氧'), opt('Potassium', '鉀')], 0, { en: 'I⁻ is discharged in preference to water when concentrated: 2I⁻ → I₂ + 2e⁻.', zh: '濃時 I⁻ 較水優先放電：2I⁻ → I₂ + 2e⁻。' })
        : mcq({ en: 'Which factor can make a normally-harder-to-discharge ion be discharged first?', zh: '哪個因素能使本來較難放電的離子先放電？' }, [opt('High concentration', '高濃度'), opt('Low temperature', '低溫'), opt('A larger beaker', '較大燒杯')], 0, { en: 'A high concentration can override the series order (e.g. conc. Cl⁻ → Cl₂).', zh: '高濃度可蓋過序的次序（例如濃 Cl⁻ → Cl₂）。' }),
    ],
  },

  {
    id: 'voltaic', icon: '⚡',
    title: { en: 'Voltaic Cell — Metal Pairs', zh: '伏打電池 —— 金屬配對' },
    desc: { en: 'Compare the EMF of different metal pairs.', zh: '比較不同金屬配對的電動勢。' },
    tags: [{ en: 'Voltaic', zh: '伏打' }, { en: 'EMF', zh: '電動勢' }],
    render: (onSample) => <VoltaicCellSim onSample={onSample} />,
    objective: { en: 'To build voltaic cells from different metal pairs and relate the EMF to the gap between their electrode potentials.', zh: '以不同金屬配對組成伏打電池，把電動勢與其電極電位差聯繫起來。' },
    variables: [{ en: 'Metal pair (electrode potentials)', zh: '金屬配對（電極電位）' }, { en: 'Cell EMF (dependent)', zh: '電池電動勢（因變量）' }],
    steps: [
      { en: 'Choose two metals and their salt solutions.', zh: '選擇兩種金屬及其鹽溶液。' },
      { en: 'Connect through a voltmeter and salt bridge.', zh: '經電壓計及鹽橋連接。' },
      { en: 'Record the EMF and identify the anode (more reactive metal).', zh: '記錄電動勢並辨認陽極（較活潑金屬）。' },
    ],
    series: [{ key: 'deposit', label: { en: 'Cathode deposit', zh: '陰極沉積' }, color: '#b45309' }],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.emf != null ? { en: `This pair gives an EMF of about ${s.emf} V. The more reactive metal is the negative anode (oxidised); the less reactive metal is the positive cathode where its ions are reduced.`, zh: `此配對的電動勢約為 ${s.emf} V。較活潑的金屬為負極陽極（被氧化）；較不活潑的金屬為正極陰極，其離子在此被還原。` } : null,
    questions: [
      (pct) => mcq({ en: 'In a Zn–Cu cell, which electrode is the negative terminal?', zh: '在 Zn–Cu 電池中，哪個電極是負極？' }, [opt('Zinc', '鋅'), opt('Copper', '銅'), opt('Both', '兩者')], 0, { en: 'The more reactive Zn is oxidised and is the negative anode.', zh: '較活潑的 Zn 被氧化，是負極陽極。' }),
      (pct) => qProduct(pct, { qEn: 'Which pair gives the LARGEST EMF?', qZh: '哪一對給出最大電動勢？', correct: opt('Mg–Cu', 'Mg–Cu'), distractors: [opt('Zn–Cu', 'Zn–Cu'), opt('Cu–Ag', 'Cu–Ag'), opt('Fe–Cu', 'Fe–Cu')], why: { en: 'Mg is far more reactive than Cu, giving the biggest potential difference.', zh: 'Mg 較 Cu 活潑得多，電位差最大。' } }),
    ],
  },

  {
    id: 'daniel', icon: '🔋',
    title: { en: 'The Daniel Cell', zh: '丹尼爾電池' },
    desc: { en: 'Zn/ZnSO₄ ‖ Cu/CuSO₄ with a salt bridge.', zh: 'Zn/ZnSO₄ ‖ Cu/CuSO₄ 及鹽橋。' },
    tags: [{ en: 'Daniel', zh: '丹尼爾' }, { en: 'EMF', zh: '電動勢' }],
    render: (onSample) => <DanielCell onSample={onSample} />,
    objective: { en: 'To study the standard Daniel cell, its half-reactions, the role of the salt bridge, and how concentration affects the EMF.', zh: '研究標準丹尼爾電池、其半反應、鹽橋的作用，以及濃度如何影響電動勢。' },
    variables: [{ en: '[ZnSO₄] and [CuSO₄]', zh: '[ZnSO₄] 及 [CuSO₄]' }, { en: 'Cell EMF (dependent)', zh: '電池電動勢（因變量）' }],
    steps: [
      { en: 'Set up Zn in ZnSO₄ and Cu in CuSO₄, joined by a salt bridge.', zh: '設置 Zn 於 ZnSO₄、Cu 於 CuSO₄，以鹽橋連接。' },
      { en: 'Measure the EMF (≈ 1.10 V at standard conditions).', zh: '量度電動勢（標準狀況約 1.10 V）。' },
      { en: 'Change the concentrations and watch the EMF shift.', zh: '改變濃度，觀察電動勢變化。' },
    ],
    series: [{ key: 'cu', label: { en: 'Cu deposited', zh: '析出 Cu' }, color: '#b45309' }],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.emf != null ? { en: `The cell EMF is about ${s.emf} V. Raising [Cu²⁺] or lowering [Zn²⁺] increases the EMF; the salt bridge carries ions to keep both half-cells neutral.`, zh: `電池電動勢約為 ${s.emf} V。提高 [Cu²⁺] 或降低 [Zn²⁺] 會增加電動勢；鹽橋傳送離子以維持兩半電池電中性。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'The standard EMF of a Daniel cell is:', qZh: '標準丹尼爾電池的電動勢是：', correct: opt('+1.10 V', '+1.10 V'), distractors: [opt('+0.42 V', '+0.42 V'), opt('−1.10 V', '−1.10 V'), opt('+2.20 V', '+2.20 V')], why: { en: 'E° = (+0.34) − (−0.76) = +1.10 V.', zh: 'E° = (+0.34) − (−0.76) = +1.10 V。' } }),
      (pct) => mcq({ en: 'Removing the salt bridge would cause the current to:', zh: '移走鹽橋會使電流：' }, [opt('Stop', '停止'), opt('Double', '加倍'), opt('Stay the same', '不變')], 0, { en: 'Charge builds up in each half-cell without ion flow, stopping the current.', zh: '沒有離子流動，各半電池電荷累積，電流停止。' }),
    ],
  },

  {
    id: 'electroplating', icon: '✨',
    title: { en: 'Electroplating', zh: '電鍍' },
    desc: { en: 'Choose the metal and object; watch Faraday in action.', zh: '選擇金屬及物件；觀察法拉第定律的應用。' },
    tags: [{ en: 'Application', zh: '應用' }, { en: 'Faraday', zh: '法拉第' }],
    render: (onSample) => <ElectroplatingSim onSample={onSample} />,
    objective: { en: 'To plate an object with a chosen metal and relate the mass deposited to the charge passed.', zh: '在物件上鍍上所選金屬，並把沉積質量與通過的電荷聯繫起來。' },
    variables: [{ en: 'Plating metal', zh: '鍍層金屬' }, { en: 'Current', zh: '電流' }, { en: 'Time', zh: '時間' }, { en: 'Mass deposited (dependent)', zh: '沉積質量（因變量）' }],
    steps: [
      { en: 'Make the object the cathode and the plating metal the anode.', zh: '把物件作陰極、鍍層金屬作陽極。' },
      { en: 'Use a solution of the plating-metal salt as electrolyte.', zh: '用鍍層金屬鹽溶液作電解質。' },
      { en: 'Pass current; the anode dissolves and the object is coated.', zh: '通電；陽極溶解，物件被鍍層覆蓋。' },
    ],
    series: [{ key: 'mass', label: { en: 'Mass plated (g)', zh: '鍍層質量 (g)' }, color: '#b45309' }],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.mass != null ? { en: `After ${s.charge} C, about ${s.mass} g of metal has plated onto the object. The object must be the cathode and the electrolyte must contain ions of the plating metal.`, zh: `通過 ${s.charge} C 後，約 ${s.mass} g 金屬鍍在物件上。物件必須作陰極，電解質必須含鍍層金屬的離子。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'To silver-plate a spoon, the spoon must be the:', qZh: '要在匙羹鍍銀，匙羹必須作：', correct: opt('Cathode', '陰極'), distractors: [opt('Anode', '陽極'), opt('Electrolyte', '電解質'), opt('Salt bridge', '鹽橋')], why: { en: 'The object is the cathode: Ag⁺ + e⁻ → Ag.', zh: '物件作陰極：Ag⁺ + e⁻ → Ag。' } }),
      qFaraday,
    ],
  },

  {
    id: 'fuelcell', icon: '🌿',
    title: { en: 'Hydrogen Fuel Cell', zh: '氫燃料電池' },
    desc: { en: 'Switch between alkaline and acidic electrolytes.', zh: '在鹼性與酸性電解質之間切換。' },
    tags: [{ en: 'Fuel Cell', zh: '燃料電池' }],
    render: (onSample) => <FuelCellSim onSample={onSample} />,
    objective: { en: 'To model a hydrogen–oxygen fuel cell and write the electrode reactions in acidic and alkaline media.', zh: '模擬氫氧燃料電池，並寫出酸性及鹼性介質中的電極反應。' },
    variables: [{ en: 'Electrolyte type (alkaline / acidic)', zh: '電解質類型（鹼性／酸性）' }, { en: 'Load', zh: '負載' }, { en: 'Power output (dependent)', zh: '輸出功率（因變量）' }],
    steps: [
      { en: 'Supply H₂ to the anode and O₂ to the cathode.', zh: '把 H₂ 供給陽極、O₂ 供給陰極。' },
      { en: 'Choose the electrolyte and adjust the load.', zh: '選擇電解質並調整負載。' },
      { en: 'Observe electron flow, ion migration and water formation.', zh: '觀察電子流動、離子遷移及水的生成。' },
    ],
    series: [{ key: 'power', label: { en: 'Power (W)', zh: '功率 (W)' }, color: '#16a34a' }],
    xLabel: { en: 'Time (s)', zh: '時間 (秒)' },
    report: (s) => s && s.power != null ? { en: `The cell delivers about ${s.power} W at the chosen load. Its only product is water (2H₂ + O₂ → 2H₂O), giving high efficiency and zero emissions at the point of use.`, zh: `在所選負載下電池輸出約 ${s.power} W。唯一產物是水（2H₂ + O₂ → 2H₂O），效率高且使用時零排放。` } : null,
    questions: [
      (pct) => qProduct(pct, { qEn: 'The only product of a H₂–O₂ fuel cell is:', qZh: '氫氧燃料電池的唯一產物是：', correct: opt('Water', '水'), distractors: [opt('Carbon dioxide', '二氧化碳'), opt('Hydrogen peroxide', '過氧化氫'), opt('Ozone', '臭氧')], why: { en: 'Overall 2H₂ + O₂ → 2H₂O.', zh: '總反應 2H₂ + O₂ → 2H₂O。' } }),
      (pct) => pct >= 60
        ? mcq({ en: 'In an ACIDIC fuel cell, the anode half-equation is:', zh: '在酸性燃料電池中，陽極半反應方程式是：' }, [opt('H₂ → 2H⁺ + 2e⁻', 'H₂ → 2H⁺ + 2e⁻'), opt('H₂ + 2OH⁻ → 2H₂O + 2e⁻', 'H₂ + 2OH⁻ → 2H₂O + 2e⁻'), opt('O₂ + 4H⁺ + 4e⁻ → 2H₂O', 'O₂ + 4H⁺ + 4e⁻ → 2H₂O')], 0, { en: 'In acid, H₂ is oxidised to H⁺.', zh: '在酸中 H₂ 被氧化成 H⁺。' })
        : mcq({ en: 'A fuel cell differs from a battery because it:', zh: '燃料電池與電池不同之處是它：' }, [opt('runs continuously while fuel is supplied', '只要供應燃料便連續運作'), opt('needs recharging', '需要充電'), opt('stores energy internally', '在內部儲能')], 0, { en: 'It is fed fuel externally rather than storing energy.', zh: '它由外部供給燃料，而非儲存能量。' }),
    ],
  },
]

export const getExperiment = (id) => EXPERIMENTS.find(e => e.id === id)
