import { AnalysisResult } from '../types/analysis';

export const MOCK_ANALYSIS_RESULTS: Record<string, AnalysisResult> = {
  code_debugger: {
    session_id: 'mock_code_session_001',
    analysis_type: 'code_debugger',
    summary: 'TypeError: Cannot read properties of undefined (reading \'map\') in React Component rendering.',
    findings: [
      'The API response payload is undefined upon the initial component render.',
      'The component attempts to execute `items.map()` directly inside JSX without an initial array default or loading guard.',
      'Data fetch promise resolves asynchronously in useEffect, after the first render cycle completes.'
    ],
    explanation: 'In React, state declared as `useState()` without an initial value defaults to `undefined`. When the JSX mounts before the asynchronous network request completes, calling `.map()` on `undefined` causes an immediate unhandled runtime exception.',
    likely_problem: 'Unprotected array mapping over uninitialized state prior to asynchronous data load.',
    suggested_solution: 'Initialize the state with an empty array `useState([])` and use optional chaining (`items?.map`) with a defensive loading check.',
    solution_code: `// Corrected Component Implementation
import React, { useState, useEffect } from 'react';

export const ItemList: React.FC = () => {
  // Initialize with an empty array default to prevent undefined reads
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="text-slate-400">Loading items...</div>;
  }

  return (
    <ul className="space-y-2">
      {items?.map((item) => (
        <li key={item.id} className="p-2 bg-slate-800 rounded">
          {item.name}
        </li>
      ))}
    </ul>
  );
};`,
    steps: [
      'Initialize `useState<Item[]>([])` with an empty array instead of leaving it undefined.',
      'Add an `isLoading` boolean flag to safeguard against rendering empty or pending states.',
      'Use optional chaining `items?.map()` for defensive programming.'
    ],
    uncertainties: [
      'The exact API payload structure could not be verified from the screenshot alone.',
      'Check whether the API returns an object with `{ items: [...] }` or a direct array.'
    ]
  },

  circuit_analyzer: {
    session_id: 'mock_circuit_session_002',
    analysis_type: 'circuit_analyzer',
    summary: 'NE555 Timer configured as an Astable Multivibrator (Square-Wave Oscillator).',
    findings: [
      'U1 identified as standard NE555 Timer IC in an 8-pin DIP package.',
      'Timing loop formed by R1 (10kΩ), R2 (47kΩ), and C1 (10µF) connected to Pin 7 (Discharge) and Pins 2/6 (Trigger/Threshold).',
      'Pin 4 (RESET) is left unconnected and floating.'
    ],
    explanation: 'The circuit is designed to oscillate and toggle the output at Pin 3. However, on bipolar 555 timers, an unconnected RESET pin can pick up stray EMI or float low, holding the timer in a continuous reset state and inhibiting output oscillation.',
    apparent_function: 'Free-running astable pulse generator driving an output indicator at ~1.2 Hz.',
    components_identified: [
      { name: 'NE555 Timer IC', designator: 'U1', package: 'DIP-8' },
      { name: '10kΩ 1/4W Resistor', designator: 'R1' },
      { name: '47kΩ 1/4W Resistor', designator: 'R2' },
      { name: '10µF 16V Electrolytic Capacitor', designator: 'C1' },
      { name: '0.01µF Ceramic Capacitor (Control)', designator: 'C2' },
      { name: 'Red 5mm LED + 330Ω Current Limiting Resistor', designator: 'D1, R3' }
    ],
    potential_issues: [
      'Pin 4 (RESET) is floating. It must be tied directly to VCC (Pin 8) to enable continuous oscillation.',
      'No decoupling capacitor (0.1µF) observed across VCC and GND pins, which may induce voltage dips during output transitions.'
    ],
    steps: [
      'Connect a jumper wire from Pin 4 (RESET) directly to Pin 8 (VCC, +5V to +12V).',
      'Measure the voltage across C1 using an oscilloscope or DMM to verify charge-discharge cycles between 1/3 VCC and 2/3 VCC.',
      'Add a 100nF ceramic decoupling capacitor adjacent to Pins 1 and 8.'
    ],
    uncertainties: [
      'R2 color banding appears partially obscured; assumed 47kΩ (Yellow-Violet-Orange). Verify with a multimeter before powering.',
      'C1 polarity orientation cannot be definitively confirmed from the image angle.'
    ]
  },

  document_explainer: {
    session_id: 'mock_doc_session_003',
    analysis_type: 'document_explainer',
    summary: 'Operational Amplifier Lab Manual: Inverting & Non-Inverting Voltage Amplifier Configurations.',
    findings: [
      'Document defines laboratory procedures for characterizing closed-loop op-amp voltage gains using the LM741 / TL081 IC.',
      'Derives formulas for closed-loop voltage gain, gain-bandwidth product (GBWP), and slew rate limitations.',
      'Specifies dual-rail power supply requirements (±12V to ±15V).'
    ],
    explanation: 'The lab manual guides undergraduate students through measuring input/output phase relationships and voltage amplification. For inverting amplifiers, the virtual ground concept at the inverting terminal is established by negative feedback.',
    key_concepts: [
      'Virtual Ground: In negative feedback op-amps, the potential difference between non-inverting (+) and inverting (-) terminals is approximately 0V.',
      'Closed-Loop Inverting Gain: Av = - (Rf / Rin)',
      'Closed-Loop Non-Inverting Gain: Av = 1 + (Rf / R1)',
      'Slew Rate Limit: SR = 2π * f_max * V_peak'
    ],
    formulas_or_definitions: [
      'Inverting Gain: V_out / V_in = - (R_feedback / R_in)',
      'Non-Inverting Gain: V_out / V_in = 1 + (R_feedback / R_ground)',
      'Gain Bandwidth Product: GBWP = A_cl × f_3dB'
    ],
    suggested_viva_questions: [
      {
        question: 'Why is the voltage at the inverting terminal called a virtual ground?',
        answer: 'Because the non-inverting terminal is connected to 0V ground, and the enormous open-loop gain forces the differential input voltage (V+ - V-) close to zero without current flowing directly into the high-impedance terminal.'
      },
      {
        question: 'What happens to the amplifier output when the input signal exceeds the slew rate?',
        answer: 'The output waveform suffers triangular distortion because the internal compensation capacitor cannot charge/discharge fast enough to track the input slope.'
      }
    ],
    steps: [
      'Verify ±12V dual-rail power supplies with a DMM before inserting the op-amp IC into the breadboard.',
      'Confirm signal generator output impedance (typically 50Ω) does not alter input voltage readings.',
      'Record peak-to-peak output voltage across a logarithmic frequency sweep from 100Hz to 1MHz.'
    ],
    uncertainties: [
      'Section 4.3 mentions an experimental high-pass filter option but cuts off before component values are listed.',
      'Datasheet revision date is not specified in the document header.'
    ]
  }
};

export const MOCK_CHAT_RESPONSES: Record<string, string[]> = {
  code_debugger: [
    'Initializing state with an empty array `useState([])` guarantees that `.map()` has a valid, iterable array immediately on render, completely eliminating the TypeError.',
    'If the error persists after that, check the Network tab in your browser DevTools to confirm whether the backend is returning `{ data: [...] }` or just `[...]`.',
    'Adding TypeScript interface definitions like `interface Item { id: string; name: string; }` will let your compiler warn you about undefined properties at build time.'
  ],
  circuit_analyzer: [
    'Pin 4 is active-LOW on the NE555. When it is floating or grounded, it forcefully discharges the internal flip-flop, preventing any pulse generation at Pin 3.',
    'You can calculate the oscillation frequency using the astable formula: f = 1.44 / ((R1 + 2*R2) * C1). With 10kΩ, 47kΩ, and 10µF, the calculated frequency is approximately 1.38 Hz.',
    'Make sure your electrolytic capacitor C1 has its negative stripe connected to GND. Reversing it could damage the capacitor or cause leakage current.'
  ],
  document_explainer: [
    'The virtual ground concept holds only when negative feedback is properly established and the op-amp is operating in its linear range without clipping at the power rails.',
    'During your lab examination, professors frequently ask about Gain-Bandwidth Product: if you increase the closed-loop gain by a factor of 10, the bandwidth decreases by a factor of 10.',
    'For the inverting amplifier, notice the 180-degree phase shift between the input and output waveforms on your oscilloscope.'
  ]
};
