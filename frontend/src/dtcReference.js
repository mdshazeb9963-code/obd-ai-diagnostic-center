const STANDARD_CODES = {
  P0101: {
    title: 'Mass or volume air flow circuit range/performance',
    description: 'The engine computer sees an air-flow reading outside the expected range. This describes a sensor reading or air-measurement problem; it does not prove the airflow sensor itself has failed.',
    causes: ['Dirty or damaged airflow sensor', 'Air leak or restriction in the intake duct', 'Wiring, connector, or air-filter problem'],
    nextStep: 'Check for other intake or fuel-trim codes and inspect the intake duct and connector before replacing parts.',
  },
  P0113: {
    title: 'Intake air temperature sensor 1 circuit high input',
    description: 'The computer is receiving an unusually high-voltage signal from the intake-air temperature circuit, often interpreted as an extremely cold reading.',
    causes: ['Open or loose sensor wiring', 'Disconnected or damaged connector', 'Failed intake-air temperature sensor'],
    nextStep: 'Compare the scan-tool temperature reading with ambient temperature after the engine has cooled; inspect wiring using the vehicle service procedure.',
  },
  P0123: {
    title: 'Throttle position sensor / switch A circuit high input',
    description: 'The throttle-control computer sees a signal that is higher than expected from one throttle-position circuit. Electronic throttle designs vary by vehicle.',
    causes: ['Throttle-position sensor or throttle-body issue', 'Damaged wiring, poor connection, or short to voltage', 'Throttle body needs vehicle-specific inspection or calibration'],
    nextStep: 'If the vehicle has reduced power or unpredictable throttle response, stop driving and have it inspected. Do not adjust the throttle by guesswork.',
  },
  P0128: {
    title: 'Coolant thermostat temperature below regulating temperature',
    description: 'The engine did not warm up as quickly or as much as the computer expected during its monitoring conditions.',
    causes: ['Thermostat stuck open or incorrect thermostat', 'Low coolant or air in the cooling system', 'Coolant-temperature sensor or wiring issue'],
    nextStep: 'Check the coolant level only when the engine is fully cool. If it is overheating or losing coolant, stop driving and arrange service.',
  },
  P0135: {
    title: 'Oxygen sensor heater circuit malfunction (Bank 1, Sensor 1)',
    description: 'The computer detected an electrical problem in the heater circuit for the upstream oxygen or air-fuel-ratio sensor on Bank 1.',
    causes: ['Sensor heater failure', 'Blown fuse or power-supply issue', 'Damaged wiring or connector'],
    nextStep: 'Check related heater-circuit codes, fuses, and wiring against the exact vehicle wiring diagram before replacing the sensor.',
  },
  P0171: {
    title: 'System too lean (Bank 1)',
    description: 'The computer has had to add more fuel than expected on Bank 1 to compensate for a lean air/fuel mixture. The code reports the correction, not the failed part.',
    causes: ['Unmetered air leak or vacuum leak', 'Low fuel pressure or restricted fuel supply', 'Airflow sensor contamination or exhaust leak near an upstream sensor'],
    nextStep: 'Review fuel trims and freeze-frame data, and look for companion codes or intake leaks before replacing sensors.',
  },
  P0172: {
    title: 'System too rich (Bank 1)',
    description: 'The computer is reducing fuel more than expected on Bank 1 because its readings indicate a rich air/fuel mixture.',
    causes: ['Leaking injector or excessive fuel pressure', 'Airflow or oxygen-sensor reading error', 'Purge-system fault or restricted air intake'],
    nextStep: 'Review fuel trims, fuel pressure, and related codes with vehicle-specific service information; the code alone does not identify a failed part.',
  },
  P0300: {
    title: 'Random/multiple cylinder misfire detected',
    description: 'The engine computer detected misfires on multiple cylinders or could not isolate one cylinder. A misfire means combustion did not occur as expected.',
    causes: ['Worn spark plugs or ignition-coil fault', 'Fuel-delivery or injector problem', 'Intake/vacuum leak or an engine mechanical issue'],
    nextStep: 'Check freeze-frame and misfire-counter data. If the check-engine light is flashing or the engine is shaking, reduce load, stop when safe, and arrange prompt inspection.',
  },
  P0301: {
    title: 'Cylinder 1 misfire detected',
    description: 'The engine computer detected combustion misfires associated with cylinder 1. The code identifies the cylinder, not the failed component.',
    causes: ['Spark plug or ignition-coil issue', 'Injector or fuel-delivery problem', 'Cylinder-specific air leak or mechanical problem'],
    nextStep: 'Use the vehicle-specific cylinder layout and misfire data. If the check-engine light flashes or the engine runs roughly, stop when safe and arrange prompt inspection.',
  },
  P0302: {
    title: 'Cylinder 2 misfire detected',
    description: 'The engine computer detected combustion misfires associated with cylinder 2. The code identifies the cylinder, not the failed component.',
    causes: ['Spark plug or ignition-coil issue', 'Injector or fuel-delivery problem', 'Cylinder-specific air leak or mechanical problem'],
    nextStep: 'Use the vehicle-specific cylinder layout and misfire data. If the check-engine light flashes or the engine runs roughly, stop when safe and arrange prompt inspection.',
  },
  P0303: {
    title: 'Cylinder 3 misfire detected',
    description: 'The engine computer detected combustion misfires associated with cylinder 3. The code identifies the cylinder, not the failed component.',
    causes: ['Spark plug or ignition-coil issue', 'Injector or fuel-delivery problem', 'Cylinder-specific air leak or mechanical problem'],
    nextStep: 'Use the vehicle-specific cylinder layout and misfire data. If the check-engine light flashes or the engine runs roughly, stop when safe and arrange prompt inspection.',
  },
  P0304: {
    title: 'Cylinder 4 misfire detected',
    description: 'The engine computer detected combustion misfires associated with cylinder 4. The code identifies the cylinder, not the failed component.',
    causes: ['Spark plug or ignition-coil issue', 'Injector or fuel-delivery problem', 'Cylinder-specific air leak or mechanical problem'],
    nextStep: 'Use the vehicle-specific cylinder layout and misfire data. If the check-engine light flashes or the engine runs roughly, stop when safe and arrange prompt inspection.',
  },
  P0420: {
    title: 'Catalyst system efficiency below threshold (Bank 1)',
    description: 'The computer found that the catalyst-monitor readings on Bank 1 did not meet its expected efficiency threshold. This code alone does not prove the catalytic converter is bad.',
    causes: ['Exhaust leak or oxygen-sensor issue', 'Engine misfire or fuel-mixture problem affecting the catalyst', 'Catalyst deterioration'],
    nextStep: 'Resolve misfire and mixture codes first and check for exhaust leaks. A technician should verify sensor data before considering a converter.',
  },
  P0430: {
    title: 'Catalyst system efficiency below threshold (Bank 2)',
    description: 'The computer found that the catalyst-monitor readings on Bank 2 did not meet its expected efficiency threshold. This code alone does not prove the catalytic converter is bad.',
    causes: ['Exhaust leak or oxygen-sensor issue', 'Engine misfire or fuel-mixture problem affecting the catalyst', 'Catalyst deterioration'],
    nextStep: 'Resolve misfire and mixture codes first and check for exhaust leaks. A technician should verify sensor data before considering a converter.',
  },
  P0442: {
    title: 'Evaporative emission system leak detected (small leak)',
    description: 'The EVAP monitor detected a small loss of sealing in the fuel-vapor system. The code does not identify the leak location.',
    causes: ['Loose, damaged, or incorrect fuel cap', 'Small leak in a hose, seal, or EVAP component', 'Vent or purge valve not sealing'],
    nextStep: 'Make sure the correct fuel cap is properly secured. If the code returns, ask a technician to test the EVAP system for leaks.',
  },
  P0455: {
    title: 'Evaporative emission system leak detected (large leak)',
    description: 'The EVAP monitor detected a large leak or inability to seal the fuel-vapor system. This is an emissions fault and usually does not by itself indicate a drivability failure.',
    causes: ['Missing, loose, or damaged fuel cap', 'Disconnected or split EVAP hose', 'Purge or vent valve stuck open'],
    nextStep: 'Check that the correct fuel cap is fitted and tight. If fuel is leaking or you smell strong fuel vapors, stop and get help; otherwise request an EVAP leak test.',
  },
  P0456: {
    title: 'Evaporative emission system leak detected (very small leak)',
    description: 'The EVAP monitor detected a very small loss of sealing in the fuel-vapor system. The scan code does not pinpoint where it is leaking.',
    causes: ['Fuel cap seal or fit issue', 'Small hose, seal, or canister leak', 'Purge or vent valve not sealing completely'],
    nextStep: 'Check that the correct fuel cap is seated and undamaged. If the code returns, an EVAP smoke or leak test may be needed.',
  },
  P0500: {
    title: 'Vehicle speed sensor malfunction',
    description: 'The computer did not receive a valid vehicle-speed signal under the conditions it expected. Several systems may share this signal.',
    causes: ['Speed sensor or tone-ring issue', 'Damaged wiring or connector', 'Network, ABS, or instrument-cluster signal problem'],
    nextStep: 'Check for ABS and communication codes too; have the speed signal and wiring checked using the vehicle-specific diagram.',
  },
  P0700: {
    title: 'Transmission control system malfunction indicator requested',
    description: 'The engine computer was told by the transmission controller that a fault is stored. P0700 is usually a request to retrieve the transmission module’s own codes, not the full diagnosis.',
    causes: ['A transmission control code is stored in the TCM', 'Transmission sensor, electrical, hydraulic, or control issue (exact code needed)'],
    nextStep: 'Scan the transmission control module with a tool that can read manufacturer-specific transmission codes before drawing conclusions.',
  },
}

const TOYOTA_CODES = {
  C1241: {
    title: 'Low or abnormally high battery-positive voltage (Toyota brake/ABS system)',
    description: 'On Toyota brake-control systems covered by the linked service references, the skid-control ECU detected a supply-voltage problem. A temporary low auxiliary-battery voltage can also store related brake codes. Detection conditions differ by model and year.',
    causes: ['Low or unstable 12 V auxiliary-battery voltage', 'Charging-system or brake-control power-supply issue', 'Fuse, relay, wiring, or connector fault in the brake/ABS supply circuit'],
    nextStep: 'Have the stored ABS/brake codes and freeze-frame checked, then test the power supply using the exact vehicle service procedure. If a brake/ABS warning is on or brake feel changes, stop when safe and arrange prompt inspection.',
    source: 'Toyota service manual reference · confirm model and year',
    sourceUrl: 'https://toyotamanuals.gitlab.io/PZ471-Z01S0-CA/htmlweb/rm/rm1076e/m_05_0782.pdf',
  },
  C1256: {
    title: 'Accumulator low pressure (Toyota brake system)',
    description: 'On Toyota brake systems covered by the linked references, the brake controller detected hydraulic accumulator pressure below its specified value. The code identifies a pressure condition, not a confirmed failed part; exact causes and test steps vary by model/year.',
    causes: ['Brake-booster accumulator or pump assembly', 'Hydraulic pump motor, circuit, or related wiring', 'Accumulator pressure sensor or hydraulic brake system'],
    nextStep: 'Because this concerns brake pressure, arrange prompt inspection by a qualified Toyota/brake technician. If a brake warning/buzzer is active, the pedal feels different, or braking is reduced, do not drive; arrange towing.',
    source: 'Toyota service manual reference · confirm model and year',
    sourceUrl: 'https://toyotamanuals.gitlab.io/RM0814E/xmlweb/SB/13030912.pdf',
  },
  C1268: {
    title: 'Manufacturer-specific chassis code · exact vehicle details needed',
    description: 'C1268 is not a universal OBD-II definition. For example, some Toyota 4WD service manuals use it for the transfer L4 position-switch circuit, while code assignments can differ across models, years, and control modules. The scan does not provide enough confirmed vehicle context to say that example applies to your car.',
    causes: ['On applicable Toyota 4WD models only: transfer L4 position switch or its circuit', 'The correct cause depends on the vehicle and the module that reported the code'],
    nextStep: 'Check the vehicle make, model, year, and scan-tool module (such as ABS/VSC) against the matching service manual. Do not replace a part based on this example.',
    source: 'Toyota 4Runner service manual example · applicability varies',
    sourceUrl: 'https://www.toyota-4runner.org/attachments/3rd-gen-t4rs/145120d1423199799-1999-t4r-trouble-code-help-please-05-diagnostics-pdf',
  },
}

const PLACEHOLDER_TEXT = /no verified diagnostic provider|no verified description|code was extracted from the uploaded text|sample code detected/i

export function inferVehicleMake(text = '') {
  const value = String(text).toLowerCase()
  if (/toyota|lexus/.test(value)) return value.includes('lexus') ? 'Lexus' : 'Toyota'
  return null
}

export function getDtcReference(code, { make } = {}) {
  const normalized = String(code || '').toUpperCase()
  if (make && /^toyota$/i.test(make) && TOYOTA_CODES[normalized]) return TOYOTA_CODES[normalized]
  if (STANDARD_CODES[normalized]) return {
    ...STANDARD_CODES[normalized],
    source: 'Built-in OBD-II reference · verify against vehicle service information',
  }
  if (/^C1/.test(normalized)) return {
    title: 'Manufacturer-specific chassis code · vehicle details needed',
    description: 'C1xxx chassis codes are not assigned one universal meaning across manufacturers. The exact definition can depend on make, model, year, and which control module reported it; this browser demo has no manufacturer database connected.',
    causes: [],
    nextStep: 'Check the vehicle make, model, year, and scan-tool module against manufacturer service information. Add those details when asking a technician to interpret this code.',
    source: 'Manufacturer-specific code · exact reference unavailable offline',
  }
  return {
    title: 'Code reference not available offline',
    description: 'This code was extracted from the scanner file, but it is not in the browser demo’s built-in reference. The code alone is not enough to identify a failed part.',
    causes: [],
    nextStep: 'Use the vehicle make, model, year, engine, and the module that reported the code to look it up in matching manufacturer service information.',
    source: 'Offline reference library · code not listed',
  }
}

export function enrichDiagnostic(item, options = {}) {
  const reference = getDtcReference(item.code, options)
  const descriptionIsPlaceholder = !item.description || PLACEHOLDER_TEXT.test(item.description)
  return {
    ...reference,
    ...item,
    title: item.title || reference.title,
    description: descriptionIsPlaceholder ? reference.description : item.description,
    causes: item.causes?.length ? item.causes : reference.causes,
    nextStep: item.nextStep || reference.nextStep,
    source: !item.source || item.source === 'Synthetic sample file' ? reference.source : item.source,
    sourceUrl: item.sourceUrl || reference.sourceUrl,
  }
}
