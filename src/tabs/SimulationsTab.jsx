import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import MoltenPbBr2Sim from '../simulations/MoltenPbBr2'
import CuSO4Sim from '../simulations/CuSO4Sim'
import BrineSim from '../simulations/BrineSim'
import H2SO4Sim from '../simulations/H2SO4Sim'
import DanielCell from '../simulations/DanielCell'
import ElectroplatingSim from '../simulations/Electroplating'
import VoltaicCellSim from '../simulations/VoltaicCell'
import FuelCellSim from '../simulations/FuelCell'

const SIMS = [
  { id: 'molten', title: 'Molten PbBr₂ Electrolysis', icon: '🔥', desc: 'Electrolysis of molten lead(II) bromide with animated Pb²⁺ and Br⁻ ions', component: <MoltenPbBr2Sim />, tags: ['Molten', 'Electrolysis'] },
  { id: 'cuso4_inert', title: 'CuSO₄ — Inert Electrodes', icon: '🔵', desc: 'Copper(II) sulphate with carbon electrodes. Cu deposits at cathode, O₂ at anode', component: <CuSO4Sim activeElectrodes={false} />, tags: ['Aqueous', 'Inert'] },
  { id: 'cuso4_active', title: 'CuSO₄ — Active Cu Electrodes', icon: '🟠', desc: 'Active copper anode dissolves, pure Cu deposits at cathode. Basis of copper refining', component: <CuSO4Sim activeElectrodes={true} />, tags: ['Aqueous', 'Active', 'Refining'] },
  { id: 'brine', title: 'Brine Electrolysis', icon: '🟢', desc: 'NaCl(aq) — see how concentration switches the anode product from Cl₂ to O₂', component: <BrineSim />, tags: ['Aqueous', 'Brine', 'Concentration'] },
  { id: 'h2so4', title: 'Hoffman Voltameter (H₂SO₄)', icon: '⚗️', desc: 'Dilute H₂SO₄ electrolysis. Observe 2:1 H₂:O₂ volume ratio in real time', component: <H2SO4Sim />, tags: ['Aqueous', 'Gas ratio'] },
  { id: 'voltaic', title: 'Voltaic Cell — Metal Pairs', icon: '⚡', desc: 'Compare EMF of different metal pairs. Electron flow, electrode reactions, Nernst effect', component: <VoltaicCellSim />, tags: ['Voltaic', 'EMF'] },
  { id: 'daniel', title: 'Daniel Cell', icon: '🔋', desc: 'Classic Zn/ZnSO₄ ‖ Cu/CuSO₄ cell with salt bridge. Adjust concentrations and observe EMF change', component: <DanielCell />, tags: ['Voltaic', 'Daniel', 'EMF'] },
  { id: 'electroplating', title: 'Electroplating', icon: '✨', desc: 'Choose the plating metal and object. See Faraday calculations in real time', component: <ElectroplatingSim />, tags: ['Application', 'Faraday'] },
  { id: 'fuelcell', title: 'Hydrogen Fuel Cell', icon: '🌿', desc: 'H₂/O₂ fuel cell — switch between alkaline and acidic electrolytes, adjust load', component: <FuelCellSim />, tags: ['Fuel Cell', 'Voltaic'] },
]

export default function SimulationsTab() {
  const { markSimViewed, progress } = useApp()
  const [active, setActive] = useState(null)

  const open = (sim) => { setActive(sim); markSimViewed(sim.id) }

  if (active) {
    return (
      <div>
        <button onClick={() => setActive(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
          ← All simulations
        </button>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">{active.icon} {active.title}</h2>
          <p className="text-gray-500 text-sm mt-1">{active.desc}</p>
        </div>
        <div className="info-box text-xs mb-4">
          💡 Use the sliders to change variables and observe how the simulation responds. Yellow dots = electrons in external circuit. Coloured circles = ions.
        </div>
        {active.component}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Interactive Simulations</h2>
        <p className="text-gray-500 text-sm mt-1">Click any simulation to launch it. Use variable controls to experiment.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SIMS.map(sim => {
          const viewed = progress.simsViewed.includes(sim.id)
          return (
            <button key={sim.id} onClick={() => open(sim)} className={`card text-left hover:border-blue-600 transition-all group ${viewed ? 'border-green-800/40' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{sim.icon}</span>
                {viewed && <span className="text-green-400 text-xs bg-green-950/50 border border-green-800/50 px-2 py-0.5 rounded-full">Visited</span>}
              </div>
              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-sm mb-2">{sim.title}</h3>
              <p className="text-gray-500 text-xs mb-3">{sim.desc}</p>
              <div className="flex flex-wrap gap-1">
                {sim.tags.map(t => (
                  <span key={t} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
