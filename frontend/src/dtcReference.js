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
  C1452: {
    title: 'Accumulator pressure below threshold after braking (Toyota brake system example)',
    description: 'On some Toyota hydraulic brake systems, the controller recorded accumulator pressure below its threshold after braking. This describes a brake-pressure condition; the same code can have different detection steps on other model years.',
    causes: ['Hydraulic circuit leak or pressure loss', 'Accumulator pressure sensor or its circuit', 'Brake booster or hydraulic control assembly'],
    nextStep: 'Have the ABS/brake module codes and hydraulic system checked promptly using the exact service procedure. If a brake warning is active, the pedal feels different, or braking is reduced, do not drive; arrange towing.',
    source: 'Toyota 4Runner service manual example · model applicability varies',
    sourceUrl: 'https://www.to4runner.net/accumulator_low_pressure_c1452_-650.html',
  },
  P1603: {
    title: 'Engine stall history (Toyota powertrain example)',
    description: 'The engine controller recorded an engine-stall event. This code is a history clue; it does not identify why the engine stalled or prove the problem is still present. Toyota describes this code on some engine systems, and exact conditions vary by model.',
    causes: ['Fuel delivery or fuel quality issue', 'Air intake, ignition, sensor, or engine-control issue', 'An intermittent stall or high accessory/drivetrain load'],
    nextStep: 'Ask for freeze-frame data and related engine codes, and note whether the engine actually stalled, when it happened, and whether it restarts normally.',
    source: 'Toyota service manual example · confirm engine and year',
    sourceUrl: 'https://toyotamanuals.gitlab.io/rm2661e/rm2661e/MANUAL.HTM/rm2661e/repair2/html/contents/rm0000031hw06ux.html',
  },
  P1604: {
    title: 'Startability malfunction (Toyota powertrain example)',
    description: 'On Toyota engine systems using this definition, the engine took too long to start, did not start as expected, or slowed/stalled shortly after starting. The code points to a starting problem, not one specific failed part. Toyota service references also note that running out of fuel can set it.',
    causes: ['Fuel level, fuel pressure, or fuel-delivery issue', 'Battery, starter, immobilizer, or engine sensor/wiring issue', 'Air intake, ignition, compression, or engine-control issue'],
    nextStep: 'Record the starting symptoms and retrieve freeze-frame data and companion codes. If the vehicle stalls in traffic or will not start reliably, arrange professional diagnosis before relying on it.',
    source: 'Toyota service manual example · confirm engine and year',
    sourceUrl: 'https://toyotaspace.com/wp-content/uploads/2024/08/Toyota-DTC-P1604-1.pdf',
  },
  P1605: {
    title: 'Rough idling detected (Toyota powertrain example)',
    description: 'On Toyota engine systems using this definition, the engine computer detected unstable engine speed while idling. This describes the symptom and does not isolate a failed component.',
    causes: ['Intake-air leak or purge-valve issue', 'Fuel delivery, airflow/coolant sensor, or ignition supply problem', 'Engine-control, electrical, or mechanical issue'],
    nextStep: 'Note whether the engine shakes or nearly stalls at idle, check for related misfire/air-fuel codes, and have freeze-frame and live data reviewed.',
    source: 'Toyota technical service bulletin example · model applicability varies',
    sourceUrl: 'https://static.nhtsa.gov/odi/tsbs/2014/MC-10134184-9999.pdf',
  },
  B1441: {
    title: 'Air-mix damper servo circuit (Toyota HVAC example)',
    description: 'On some Toyota air-conditioning systems, this code points to the air-mix door servo circuit that helps control outlet temperature. It does not prove the servo itself has failed; the code and exact door location vary by model.',
    causes: ['Air-mix servo or damper binding', 'HVAC wiring, connector, or communication fault', 'Air-conditioning amplifier, calibration, or model-specific software issue'],
    nextStep: 'Check whether cabin temperature or airflow differs by side, then have the HVAC module and matching year/model service information checked before replacing the servo.',
    source: 'Toyota HVAC service bulletin example · model applicability varies',
    sourceUrl: 'https://static.nhtsa.gov/odi/tsbs/2021/MC-10187278-9999.pdf',
  },
  B1442: {
    title: 'Air-inlet damper servo circuit (Toyota HVAC example)',
    description: 'On some Toyota air-conditioning systems, this code points to the servo circuit that moves the fresh-air/recirculation door. It identifies a circuit or position-control fault, not a confirmed bad motor.',
    causes: ['Air-inlet servo or damper binding', 'HVAC wiring, connector, or communication fault', 'Air-conditioning amplifier, calibration, or model-specific software issue'],
    nextStep: 'Check whether fresh-air/recirculation mode responds normally and have the HVAC module and correct service procedure checked before replacing parts.',
    source: 'Toyota HVAC service bulletin example · model applicability varies',
    sourceUrl: 'https://static.nhtsa.gov/odi/tsbs/2021/MC-10187278-9999.pdf',
  },
  B1443: {
    title: 'Air-outlet damper servo circuit (Toyota HVAC example)',
    description: 'On some Toyota air-conditioning systems, this code points to the servo circuit that directs air to the selected vents. It describes a control/circuit problem; it does not prove the servo itself has failed.',
    causes: ['Air-outlet servo or damper binding', 'HVAC wiring, connector, or communication fault', 'Air-conditioning amplifier, calibration, or model-specific software issue'],
    nextStep: 'Check whether dash, floor, and defrost outlet selections respond normally. Have the HVAC module checked using the correct model-year procedure.',
    source: 'Toyota HVAC service bulletin example · model applicability varies',
    sourceUrl: 'https://static.nhtsa.gov/odi/tsbs/2021/MC-10187278-9999.pdf',
  },
  B1497: {
    title: 'Bus IC communication malfunction (Toyota HVAC example)',
    description: 'On some Toyota air-conditioning systems, this code means the A/C amplifier and damper servos are not communicating correctly over their shared harness. If B1441, B1442, or B1443 is also present, a shared harness/amplifier issue may be relevant; confirm the module and model first.',
    causes: ['Open or faulty A/C harness or communication line', 'Damper servo or connector communication fault', 'Air-conditioning amplifier issue'],
    nextStep: 'Have the A/C module identify the reporting system and inspect the shared communication path using the vehicle-specific wiring diagram.',
    source: 'Toyota service manual example · HVAC meaning varies by model',
    sourceUrl: 'https://charm.li/Toyota/2007/RAV4%202WD%20L4-2.4L%20%282AZ-FE%29/Repair%20and%20Diagnosis/A%20L%20L%20%20Diagnostic%20Trouble%20Codes%20%28%20DTC%20%29/Testing%20and%20Inspection/B%20Code%20Charts/B1497/',
  },
  B1653: {
    title: 'Seat-position airbag sensor circuit malfunction (Toyota SRS example)',
    description: 'On some Toyota SRS systems, this code indicates an electrical fault in the seat-position sensor circuit used by the airbag system. It can affect how the restraint system operates; exact sensor and detection details vary by model.',
    causes: ['Seat-position sensor or its circuit', 'Under-seat/floor wiring or connector issue', 'Airbag control module fault'],
    nextStep: 'Have the SRS system checked by a qualified airbag technician. Do not probe, unplug, or repair airbag wiring yourself; follow the vehicle safety procedure.',
    source: 'Toyota SRS service manual example · confirm model and year',
    sourceUrl: 'https://charm.li/Toyota/2008/Corolla%20L4-1.8L%20%281ZZ-FE%29/Repair%20and%20Diagnosis/A%20L%20L%20%20Diagnostic%20Trouble%20Codes%20%28%20DTC%20%29/Testing%20and%20Inspection/B%20Code%20Charts/B1653/',
  },
  B1656: {
    title: 'Left-front seat-belt buckle switch circuit malfunction (Toyota SRS example)',
    description: 'On some Toyota SRS systems, this code indicates an electrical fault in the left-front seat-belt buckle switch circuit. The code does not prove the buckle switch is the failed part, and applicability varies by model.',
    causes: ['Seat-belt buckle switch or inner-belt assembly', 'Floor wiring or connector fault', 'Airbag control module fault'],
    nextStep: 'Have the restraint system diagnosed by a qualified SRS technician. Do not test or unplug airbag/seat-belt connectors yourself.',
    source: 'Toyota SRS service manual example · confirm model and year',
    sourceUrl: 'https://lemon-manuals.la/Toyota/2020/Camry%20Hybrid%20LE/Repair%20and%20Diagnosis%20%28Single%20Page%29/Restraints/Air%20Bag%2C%20SRS/Airbag%20System%20-%20Diagnostic%20Codes%20%282%20Of%202%29%20%26%20Symptom%20Tests%20%28Hybrid%29/Airbag%20System/DTC%20B1656%3A%20Seat%20Belt%20Buckle%20Switch%20%28LH%29%20%5B07%2F2017%20-%20%5D/Description/',
  },
  B2312: {
    title: 'Power-window switch/control malfunction (Toyota example)',
    description: 'On some Toyota body-control systems, B2312 identifies a power-window switch/control problem. The exact component differs by vehicle: some manuals describe a switch signal, while others describe a door-window control or motor issue.',
    causes: ['Power-window switch or its signal circuit', 'Door wiring, connector, or window-control module', 'Window motor/regulator issue on applicable models'],
    nextStep: 'Identify the module that reported the code and which window is affected, then check the matching body-electrical service information.',
    source: 'Toyota power-window service manual examples · applicability varies',
    sourceUrl: 'https://www.tochr.net/1544/diagnostic_trouble_code_chart.html',
  },
  U1117: {
    title: 'Lost communication with accessory gateway (Toyota example)',
    description: 'On applicable Toyota network systems, a control module could not receive messages from the accessory gateway/bus-buffer module. U1117 is manufacturer-specific, and the exact network path depends on the reporting module and model.',
    causes: ['Gateway/bus-buffer module branch wiring or connector', 'Gateway module or its power supply', 'Vehicle network communication fault or connected accessory issue'],
    nextStep: 'Record which ECU reported U1117 and scan for related communication codes. Have the gateway and network checked with the matching Toyota wiring diagram.',
    source: 'Toyota service manual example · confirm reporting module and year',
    sourceUrl: 'https://lemon-manuals.la/Toyota/2022/Tacoma%20TRD%20Pro%2C%20Automatic%20Trans/Repair%20and%20Diagnosis%20%28Single%20Page%29/Engine%20Mechanical/Starter/Starting%20System%20%282GR-FKS%29%20-%20Diagnostic%20Codes%20%281%20Of%202%29/SMART%20KEY%20SYSTEM%20%28for%20Start%20Function%29/DTC%20U0100%3A%20Lost%20Communication%20with%20ECM%20%2F%20PCM%3B%20DTC%20U0140%3A%20Lost%20Communication%20with%20Main%20Body%20ECU%3B%20DTC%20U0142%3A%20Lost%20Communication%20with%20Main%20Body%20ECU%3B%20DTC%20U0155%3A%20Lost%20Communication%20with%20Combination%20Meter%3B%20DTC%20U1117%3A%20Lost%20Communication%20with%20Accessory%20Gateway%20%5B08%2F2015%20-%20%5D/Description/',
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
