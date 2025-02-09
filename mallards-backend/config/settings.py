import os

# OpenAI Settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4-0125-preview"

# Model Configuration Settings
MODEL_CONFIGS = {
    'isolation-forest': {
        'default_params': {
            'contamination': 0.1,
            'n_estimators': 100,
        },
        'param_bounds': {
            'contamination': (0.0, 0.5),
            'n_estimators': (50, 1000),
        }
    },
    'autoencoder': {
        'default_params': {
            'hidden_layers': 'medium',
            'learning_rate': 0.001,
        },
        'param_bounds': {
            'hidden_layers': ['simple', 'medium', 'complex'],
            'learning_rate': (0.0001, 0.01),
        }
    },
    'prophet': {
        'default_params': {
            'seasonality_mode': 'additive',
            'changepoint_prior_scale': 0.05,
        },
        'param_bounds': {
            'seasonality_mode': ['additive', 'multiplicative'],
            'changepoint_prior_scale': (0.001, 0.5),
        }
    },
    'arima': {
        'default_params': {
            'order': '1,1,1',
            'seasonal': 'none',
        },
        'param_bounds': {
            'order': ['1,1,1', '2,1,2', '0,1,1', '1,1,2'],
            'seasonal': ['none', 'daily', 'weekly', 'monthly'],
        }
    }
}

# Monitoring Focus Configurations
MONITORING_CONFIGS = {
    'pattern': {
        'required_fields': ['transactionDate', 'transactionType'],
        'thresholds': {
            'sensitivity': 2.0,
            'alert_confidence': 0.8,
        },
        'time_windows': ['24h', '7d', '30d'],
        'grouping_fields': ['transactionType', 'region']
    },
    'decision': {
        'required_fields': ['approvalStatus', 'transactionDate'],
        'thresholds': {
            'sensitivity': 1.5,
            'alert_confidence': 0.9,
        },
        'time_windows': ['7d', '30d', '90d'],
        'grouping_fields': ['transactionDate', 'region']
    },
    'bias': {
        'required_fields': ['region', 'approvalStatus'],
        'thresholds': {
            'sensitivity': 1.8,
            'alert_confidence': 0.85,
        },
        'time_windows': ['30d', '90d', '180d'],
        'grouping_fields': ['region', 'transactionType']
    }
}

# Detection Rule Settings
DETECTION_RULE_DEFAULTS = {
    'threshold': 1000,
    'timeWindow': '24h',
    'sensitivity': 2,
    'visualizationType': 'line',
    'alertThreshold': 0.8,
    'predictionWindow': '7d',
    'autoRefresh': True,
    'groupBy': ['transactionType', 'region']
}

# Performance Estimation Parameters
PERFORMANCE_ESTIMATION = {
    'confidence_margin': 0.1,
    'min_data_points': {
        'isolation-forest': 1000,
        'autoencoder': 5000,
        'prophet': 100,
        'arima': 50
    }
}