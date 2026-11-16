// Curated constants ported verbatim from backend/services; regenerate with scripts/reference-fixtures.py.
export default {
  "phases": [
    {
      "id": "pre_launch",
      "name": "Pre-Launch",
      "description": "Baseline preparation and systems checkout."
    },
    {
      "id": "launch",
      "name": "Launch",
      "description": "Illustrative elevated workload during ascent."
    },
    {
      "id": "deep_space_transit",
      "name": "Deep Space Transit",
      "description": "Extended transit, isolation, and microgravity assumptions."
    },
    {
      "id": "mars_arrival",
      "name": "Mars Arrival",
      "description": "Transition and adaptation activities near Mars."
    },
    {
      "id": "mars_surface",
      "name": "Mars Surface Operations",
      "description": "Habitat operations and illustrative EVA workload."
    },
    {
      "id": "return_transit",
      "name": "Return Transit",
      "description": "Long-duration return journey."
    },
    {
      "id": "earth_return",
      "name": "Earth Return",
      "description": "Readaptation and post-mission observation."
    }
  ],
  "scenarios": {
    "nominal": {
      "id": "nominal",
      "name": "Nominal Mission",
      "description": "Stable illustrative mission conditions with ordinary fluctuations.",
      "active_phases": [
        "pre_launch",
        "deep_space_transit",
        "mars_surface",
        "return_transit"
      ],
      "conditions": [
        "Nominal habitat operations",
        "Routine monitoring"
      ],
      "effects": {},
      "expected_effects": [
        "Small bounded variation around baseline measurements."
      ],
      "assumptions": [
        "This is not a physiological prediction.",
        "Values are generated for demonstration only."
      ]
    },
    "sleep_disruption": {
      "id": "sleep_disruption",
      "name": "Sleep Disruption",
      "description": "Illustrates reduced sleep opportunity and associated fatigue trends.",
      "active_phases": [
        "deep_space_transit",
        "return_transit"
      ],
      "conditions": [
        "Disrupted sleep schedule",
        "Limited recovery time"
      ],
      "effects": {
        "sleep": -2.0,
        "stress": 18.0,
        "fatigue": 28.0
      },
      "expected_effects": [
        "Sleep duration trends lower.",
        "Stress and fatigue indices trend higher."
      ],
      "assumptions": [
        "Sleep effects are simplified and not clinically calibrated."
      ]
    },
    "elevated_workload": {
      "id": "elevated_workload",
      "name": "Elevated Workload",
      "description": "Illustrates a period of increased physical task demand.",
      "active_phases": [
        "launch",
        "mars_arrival",
        "mars_surface"
      ],
      "conditions": [
        "High task workload",
        "Reduced rest between activities"
      ],
      "effects": {
        "heart_rate": 12.0,
        "stress": 12.0,
        "fatigue": 15.0,
        "workload": 35.0
      },
      "expected_effects": [
        "Heart rate and workload indices rise temporarily."
      ],
      "assumptions": [
        "The model does not infer injury or medical risk."
      ]
    },
    "isolation_stress": {
      "id": "isolation_stress",
      "name": "Isolation Stress",
      "description": "Illustrates gradually increasing stress during extended isolation.",
      "active_phases": [
        "deep_space_transit",
        "return_transit"
      ],
      "conditions": [
        "Communication delay",
        "Limited social contact"
      ],
      "effects": {
        "stress": 22.0,
        "fatigue": 10.0
      },
      "expected_effects": [
        "Stress index increases gradually over simulation ticks."
      ],
      "assumptions": [
        "The stress index is dimensionless and illustrative."
      ]
    },
    "elevated_radiation": {
      "id": "elevated_radiation",
      "name": "Elevated Radiation Environment",
      "description": "Illustrates a hypothetical increase in environmental dose rate.",
      "active_phases": [
        "deep_space_transit",
        "mars_arrival"
      ],
      "conditions": [
        "Hypothetical elevated dose rate",
        "Additional shielding monitoring"
      ],
      "effects": {
        "radiation": 0.28,
        "stress": 5.0
      },
      "expected_effects": [
        "Environmental dose-rate indicator rises.",
        "An environmental warning may appear."
      ],
      "assumptions": [
        "Dose rate is an illustrative index in mSv/day, not NASA mission data.",
        "No direct symptom is inferred."
      ]
    },
    "eva_activity": {
      "id": "eva_activity",
      "name": "EVA Activity",
      "description": "Illustrates extravehicular workload followed by recovery.",
      "active_phases": [
        "mars_surface"
      ],
      "conditions": [
        "EVA task",
        "Suit and habitat operations"
      ],
      "effects": {
        "heart_rate": 18.0,
        "stress": 10.0,
        "fatigue": 20.0,
        "workload": 55.0
      },
      "expected_effects": [
        "Workload and heart rate rise during the activity."
      ],
      "assumptions": [
        "The activity response is a simple demonstration model."
      ]
    }
  },
  "emergencies": {
    "sleep_deprivation": {
      "id": "sleep_deprivation",
      "name": "Sleep Deprivation",
      "description": "Reduced sleep opportunity with cumulative fatigue.",
      "starting_conditions": [
        "Sleep opportunity is reduced.",
        "Baseline telemetry remains authoritative."
      ],
      "affected_indicators": [
        "sleep_hours",
        "fatigue_index",
        "stress_index"
      ],
      "parameters": {
        "sleep_loss_hours": 1.5,
        "step_hours": 1
      },
      "actions": [
        {
          "id": "schedule_rest",
          "name": "Schedule Rest Period",
          "description": "Recover sleep and reduce fatigue.",
          "effects": {
            "sleep_hours": 1.0,
            "fatigue_index": -8.0,
            "stress_index": -3.0
          },
          "explanation": "Rest adds recovery in the illustrative model."
        },
        {
          "id": "reduce_workload",
          "name": "Reduce Workload",
          "description": "Lower task demand while preserving the sleep deficit.",
          "effects": {
            "workload_index": -15.0,
            "fatigue_index": -3.0
          },
          "explanation": "Reduced demand limits additional fatigue."
        },
        {
          "id": "continue_schedule",
          "name": "Continue Current Schedule",
          "description": "No intervention; allow the condition to persist.",
          "effects": {
            "fatigue_index": 6.0,
            "stress_index": 3.0,
            "sleep_hours": -0.5
          },
          "explanation": "The model applies continued recovery debt."
        }
      ],
      "assumptions": [
        "Sleep effects are simplified and not clinically calibrated."
      ],
      "expected_outcomes": [
        "Rest lowers fatigue.",
        "Continuing the schedule increases fatigue."
      ]
    },
    "elevated_workload": {
      "id": "elevated_workload",
      "name": "Elevated Workload",
      "description": "Increased task demand with illustrative heart-rate and workload trends.",
      "starting_conditions": [
        "Task workload is elevated.",
        "No injury or diagnosis is inferred."
      ],
      "affected_indicators": [
        "workload_index",
        "heart_rate",
        "fatigue_index",
        "stress_index"
      ],
      "parameters": {
        "workload_increment": 20.0,
        "step_hours": 1
      },
      "actions": [
        {
          "id": "reduce_activity",
          "name": "Reduce Activity",
          "description": "Reduce task demand immediately.",
          "effects": {
            "workload_index": -20.0,
            "heart_rate": -5.0,
            "stress_index": -2.0
          },
          "explanation": "Lower demand reduces the illustrative load."
        },
        {
          "id": "schedule_recovery",
          "name": "Schedule Recovery",
          "description": "Reduce workload and allow recovery.",
          "effects": {
            "workload_index": -12.0,
            "fatigue_index": -7.0,
            "heart_rate": -3.0
          },
          "explanation": "Recovery lowers load and fatigue."
        },
        {
          "id": "continue_monitoring",
          "name": "Continue Monitoring",
          "description": "Observe without changing the workload.",
          "effects": {
            "workload_index": 8.0,
            "heart_rate": 3.0,
            "fatigue_index": 4.0
          },
          "explanation": "The model keeps the elevated demand active."
        }
      ],
      "assumptions": [
        "Effects are bounded demonstration indices, not operational guidance."
      ],
      "expected_outcomes": [
        "Reducing activity lowers workload.",
        "Monitoring alone allows a small rise."
      ]
    },
    "isolation_stress": {
      "id": "isolation_stress",
      "name": "Isolation Stress",
      "description": "Gradually increasing simulated stress during limited contact.",
      "starting_conditions": [
        "Communication opportunities are limited.",
        "Stress index is dimensionless."
      ],
      "affected_indicators": [
        "stress_index",
        "fatigue_index",
        "workload_index"
      ],
      "parameters": {
        "stress_increment": 12.0,
        "step_hours": 1
      },
      "actions": [
        {
          "id": "schedule_recreation",
          "name": "Schedule Recreation",
          "description": "Add a recovery activity.",
          "effects": {
            "stress_index": -10.0,
            "fatigue_index": -2.0
          },
          "explanation": "Recreation reduces the illustrative stress index."
        },
        {
          "id": "adjust_workload",
          "name": "Adjust Workload",
          "description": "Reduce task demand during isolation.",
          "effects": {
            "workload_index": -12.0,
            "stress_index": -4.0
          },
          "explanation": "Lower demand reduces modeled stress."
        },
        {
          "id": "request_delayed_support",
          "name": "Request Delayed Mission Support",
          "description": "Queue a support message using the mission clock.",
          "effects": {
            "stress_index": -6.0
          },
          "explanation": "Support changes the index modestly after a communication delay."
        }
      ],
      "assumptions": [
        "The index is not a psychological diagnosis."
      ],
      "expected_outcomes": [
        "Support and recreation reduce stress in this illustrative model."
      ]
    },
    "elevated_radiation_environment": {
      "id": "elevated_radiation_environment",
      "name": "Elevated Radiation Environment",
      "description": "Hypothetical environmental dose-rate warning.",
      "starting_conditions": [
        "Environmental dose-rate indicator is elevated.",
        "No immediate symptom is inferred."
      ],
      "affected_indicators": [
        "radiation_dose_rate",
        "stress_index"
      ],
      "parameters": {
        "dose_rate_increment": 0.28,
        "step_hours": 1
      },
      "actions": [
        {
          "id": "review_environmental_data",
          "name": "Review Environmental Data",
          "description": "Inspect the indicator without changing it.",
          "effects": {
            "stress_index": -1.0
          },
          "explanation": "Review has a small modeled uncertainty reduction."
        },
        {
          "id": "protective_mode",
          "name": "Enter Simulated Protective Mode",
          "description": "Apply an illustrative shielding response.",
          "effects": {
            "radiation_dose_rate": -0.18,
            "stress_index": -2.0
          },
          "explanation": "Protective mode reduces the environmental indicator only."
        },
        {
          "id": "request_mission_control_review",
          "name": "Request Mission Control Review",
          "description": "Queue an Earth review message.",
          "effects": {
            "stress_index": -1.0
          },
          "explanation": "Review is represented as a delayed support action."
        }
      ],
      "assumptions": [
        "Dose rate is an illustrative environmental indicator in mSv/day.",
        "It is not mission data or a medical exposure assessment."
      ],
      "expected_outcomes": [
        "Protective mode lowers the indicator without inferring symptoms."
      ]
    },
    "communication_delay": {
      "id": "communication_delay",
      "name": "Communication Delay",
      "description": "Delayed communication between Earth and spacecraft.",
      "starting_conditions": [
        "One-way delay is controlled by mission time.",
        "Network latency is not represented."
      ],
      "affected_indicators": [
        "stress_index"
      ],
      "parameters": {
        "one_way_delay_hours": 22.0,
        "step_hours": 1
      },
      "actions": [
        {
          "id": "send_status_request",
          "name": "Send Status Request",
          "description": "Send a demonstration status request.",
          "effects": {
            "stress_index": -1.0
          },
          "explanation": "The request is queued until simulated delivery."
        },
        {
          "id": "continue_autonomous_monitoring",
          "name": "Continue Autonomous Monitoring",
          "description": "Continue with no message.",
          "effects": {
            "stress_index": 2.0
          },
          "explanation": "The model applies a small communication uncertainty cost."
        }
      ],
      "assumptions": [
        "Delay is fictional and scenario-configurable."
      ],
      "expected_outcomes": [
        "Messages remain pending until mission time reaches delivery."
      ]
    },
    "habitat_environmental_warning": {
      "id": "habitat_environmental_warning",
      "name": "Habitat Environmental Warning",
      "description": "Hypothetical habitat monitoring warning.",
      "starting_conditions": [
        "A habitat indicator requires review.",
        "No real spacecraft procedure is implied."
      ],
      "affected_indicators": [
        "stress_index",
        "workload_index"
      ],
      "parameters": {
        "warning_level": "amber",
        "step_hours": 1
      },
      "actions": [
        {
          "id": "review_environmental_data",
          "name": "Review Environmental Data",
          "description": "Review the simulated habitat indicator.",
          "effects": {
            "stress_index": -2.0
          },
          "explanation": "Review reduces modeled uncertainty."
        },
        {
          "id": "protective_mode",
          "name": "Enter Simulated Protective Mode",
          "description": "Apply a reversible demonstration mode.",
          "effects": {
            "workload_index": -8.0,
            "stress_index": -3.0
          },
          "explanation": "The mode reduces modeled workload."
        },
        {
          "id": "request_mission_control_review",
          "name": "Request Mission Control Review",
          "description": "Queue a delayed review message.",
          "effects": {
            "stress_index": -1.0
          },
          "explanation": "Review is delayed by the mission clock."
        }
      ],
      "assumptions": [
        "Indicators are fictional demonstration inputs."
      ],
      "expected_outcomes": [
        "Review and protective mode reduce modeled workload or uncertainty."
      ]
    }
  },
  "demoSteps": [
    {
      "id": "introduction",
      "title": "Mission introduction",
      "description": "Meet AstroHealth, Team EAGLES, and the long-duration mission-health monitoring challenge.",
      "action": "Review the mission context."
    },
    {
      "id": "live_monitoring",
      "title": "Live health monitoring",
      "description": "Observe simulated telemetry and how the application presents health indicators.",
      "action": "Advance one controlled mission hour."
    },
    {
      "id": "digital_twin",
      "title": "Astronaut Digital Twin",
      "description": "Open the Digital Twin to view the same authoritative measurements in the 3D crew view.",
      "action": "Open Digital Twin when ready."
    },
    {
      "id": "mission_scenario",
      "title": "Mission scenario",
      "description": "The deterministic preset activates an Elevated Workload scenario over a Mars surface phase.",
      "action": "Review the active scenario in Mission Command."
    },
    {
      "id": "smart_alert",
      "title": "Smart alert",
      "description": "A real configured demonstration rule is triggered by the preset stress indicator; no alert is inserted in the frontend.",
      "action": "Review the Risk Alerts page."
    },
    {
      "id": "mission_response",
      "title": "Mission response",
      "description": "Select a context-specific response action and compare before/after simulated indicators.",
      "action": "Choose a response in Mission Command."
    },
    {
      "id": "analytics",
      "title": "AI health analytics",
      "description": "Review explainable statistical trends, data quality, anomalies, and forecasts when enough observations exist.",
      "action": "Open AI Health Analytics."
    },
    {
      "id": "report",
      "title": "Mission report",
      "description": "Generate a report from the current simulated state and review assumptions and limitations.",
      "action": "Download a mission report."
    }
  ],
  "alertRules": [
    [
      "heart_rate_high",
      "heart_rate",
      "BPM",
      "Heart rate above demonstration threshold",
      110,
      "ATTENTION",
      "Review the simulated workload and trend."
    ],
    [
      "heart_rate_low",
      "heart_rate",
      "BPM",
      "Heart rate below demonstration threshold",
      50,
      "ATTENTION",
      "Review the simulated trend and data quality."
    ],
    [
      "oxygen_low",
      "oxygen_saturation",
      "%",
      "Oxygen saturation below demonstration threshold",
      94,
      "HIGH PRIORITY",
      "Check the simulated sensor trend; no diagnosis is implied."
    ],
    [
      "stress_high",
      "stress_index",
      "index",
      "Stress index at or above demonstration threshold",
      70,
      "ATTENTION",
      "Review scenario factors and recent recovery patterns."
    ],
    [
      "fatigue_high",
      "fatigue_index",
      "index",
      "Fatigue index at or above demonstration threshold",
      75,
      "ATTENTION",
      "Review recent sleep and workload assumptions."
    ],
    [
      "radiation_elevated",
      "radiation_dose_rate",
      "mSv/day",
      "Environmental dose rate at or above demonstration threshold",
      0.35,
      "HIGH PRIORITY",
      "Review the illustrative environmental exposure indicator."
    ]
  ],
  "nasa": {
    "study": {
      "source_name": "NASA Open Science Data Repository (OSDR)",
      "accession": "OSD-379",
      "study_identifier": "RRRM-1 / GLDS-379",
      "title": "Transcriptional profiling of livers from mice flown on Rodent Research Reference Mission-1 (RRRM-1)",
      "study_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-379",
      "metadata_url": "https://nasa-osdr.s3.us-west-2.amazonaws.com/OSD-379/version-3/metadata/GLDS-379_metadata_GLDS-379-ISA.zip",
      "data_listing_url": "https://nasa-osdr.s3.us-west-2.amazonaws.com/?list-type=2&prefix=OSD-379/version-3/&max-keys=20",
      "study_scope": "Animal spaceflight research; not direct astronaut health telemetry.",
      "biological_context": "Female BALB/cAnNTac mice; the study profiles liver tissue using ribodepleted total RNA sequencing.",
      "mission_context": "Rodent Research-8 on the International Space Station. The study includes ISS-terminal animals, live-animal-return animals, and matched ground, basal, and vivarium controls.",
      "relevance": "Provides spaceflight-associated biological research context for understanding how mission conditions can affect animal tissues.",
      "sample_context": [
        "160 mice were included across young and old cohorts and control groups.",
        "The metadata reports 7-10 liver samples per group.",
        "Young mice were 10-12 weeks old; old mice were 32 weeks old."
      ],
      "available_measurements": [
        "Transcription profiling by RNA sequencing (RNA-seq).",
        "Illumina NovaSeq platform; paired-end 149 bp reads.",
        "Public raw sequence, processed count, normalized count, and differential-expression files are listed by the study metadata."
      ],
      "numerical_values_imported": false,
      "availability_note": "AstroHealth imports verified study metadata only. It does not download or transform RNA-seq measurements into astronaut telemetry.",
      "license_note": "The NASA OSDR AWS Open Data Registry entry states that the data has no restrictions on use. Cite NASA OSDR and the study accession.",
      "retrieved_at": "2026-11-14"
    },
    "additional_studies": [
      {
        "source_name": "NASA Open Science Data Repository (OSDR)",
        "accession": "OSD-202",
        "study_identifier": "OSD-202",
        "title": "Low dose (0.04 Gy) irradiation (LDR) and hindlimb unloading (HLU) microgravity in mice: brain transcriptomic and epigenomic data",
        "study_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-202",
        "metadata_url": "https://nasa-osdr.s3.us-west-2.amazonaws.com/OSD-202/version-10/metadata/OSD-202_metadata_OSD-202-ISA.zip",
        "data_listing_url": "https://nasa-osdr.s3.us-west-2.amazonaws.com/?list-type=2&prefix=OSD-202/version-10/&max-keys=20",
        "study_scope": "Animal ground research; not direct astronaut health telemetry.",
        "biological_context": "Mature, 6-month-old female C57BL/6 mice. Brain and eye-related tissues were collected after the modeled spaceflight conditions.",
        "mission_context": "This is a ground-based model for spaceflight, not an ISS mission. Hindlimb unloading models unloading, fluid shift, and physiological stress; whole-body 57Co gamma irradiation models a low-dose radiation component.",
        "relevance": "Its combined unloading and low-dose radiation design provides animal research context for studying biological responses relevant to spaceflight health, while not predicting human crew outcomes.",
        "sample_context": [
          "Mice were hindlimb-suspended and/or irradiated for 21 days.",
          "Tissues were collected 7 days and 1, 4, and 9 months after treatment.",
          "The study was released as a NASA-funded ground study; it is not astronaut telemetry."
        ],
        "available_measurements": [
          "Brain transcriptomic profiling by RNA sequencing.",
          "Transcription profiling by Illumina DNA microarray.",
          "DNA methylation profiling by reduced-representation bisulfite sequencing."
        ],
        "numerical_values_imported": false,
        "availability_note": "AstroHealth imports verified study metadata only. It does not download or transform OSD-202 measurements into astronaut telemetry.",
        "license_note": "The NASA OSDR AWS Open Data Registry entry states that the data has no restrictions on use. Cite NASA OSDR and the study accession.",
        "retrieved_at": "2026-11-14"
      }
    ],
    "distinction": "NASA research metadata and measurement availability are shown separately from AstroHealth's seeded simulated astronaut telemetry. The OSDR study does not calibrate the simulator, alerts, forecasts, readiness score, or medical conclusions."
  }
};
