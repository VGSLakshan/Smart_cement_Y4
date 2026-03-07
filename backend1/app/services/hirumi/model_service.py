import pickle
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class HirumiModelService:
    """Service for cement strength prediction using ensemble models"""
    
    def __init__(self):
        self.models_loaded = False
        self.xgb_models = {}
        self.lgb_models = {}
        self.ensemble_weights = {}
        self.feature_columns = []
        self.target_columns = ['1D', '2D', '7D', '28D', '56D']
        self.base_path = Path(__file__).parent.parent.parent.parent / 'ml_models' / 'hirumi'
        
    def load_models(self):
        """Load XGBoost, LightGBM models and configuration"""
        try:
            # Load model configuration
            config_path = self.base_path / 'model_config.json'
            if not config_path.exists():
                logger.warning(f"Model config not found at {config_path}. Using default configuration.")
                return False
                
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            self.feature_columns = config.get('feature_columns', [])
            self.ensemble_weights = config.get('ensemble_weights', {})
            
            # Load XGBoost models
            for target in self.target_columns:
                xgb_path = self.base_path / f'xgb_{target}.pkl'
                if xgb_path.exists():
                    with open(xgb_path, 'rb') as f:
                        self.xgb_models[target] = pickle.load(f)
                        
            # Load LightGBM models
            for target in self.target_columns:
                lgb_path = self.base_path / f'lgb_{target}.pkl'
                if lgb_path.exists():
                    with open(lgb_path, 'rb') as f:
                        self.lgb_models[target] = pickle.load(f)
                        
            self.models_loaded = len(self.xgb_models) > 0 and len(self.lgb_models) > 0
            logger.info(f"Models loaded successfully. XGBoost: {len(self.xgb_models)}, LightGBM: {len(self.lgb_models)}")
            return self.models_loaded
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False
    
    def engineer_features(self, input_data: Dict[str, float]) -> pd.DataFrame:
        """Apply feature engineering transformations"""
        # Create base DataFrame
        df = pd.DataFrame([input_data])
        
        # Map input fields to expected column names
        column_mapping = {
            'initial_min': 'Initial (min)',
            'final_min': 'Final (min)',
            'residue_45um': 'Residue 45µm(%)',
            'fineness': 'Fineness(cm2/g)',
            'loi': 'L.O.I.',
            'sio2': 'SiO2',
            'al2o3': 'Al2O3',
            'fe2o3': 'Fe2O3',
            'cao': 'CaO',
            'mgo': 'MgO',
            'so3': 'SO3',
            'k2o': 'K20',
            'na2o': 'Na2O',
            'cl': 'Cl'
        }
        
        df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns}, inplace=True)
        
        # 1. Interaction Features
        df['CaO_SiO2'] = df['CaO'] * df['SiO2']
        df['CaO_Al2O3'] = df['CaO'] * df['Al2O3']
        df['SiO2_Al2O3'] = df['SiO2'] * df['Al2O3']
        df['Fe2O3_Al2O3'] = df['Fe2O3'] * df['Al2O3']
        df['CaO_Fe2O3'] = df['CaO'] * df['Fe2O3']
        
        # 2. Ratio Features
        df['CaO_SiO2_ratio'] = df['CaO'] / (df['SiO2'] + 0.01)
        df['Al2O3_Fe2O3_ratio'] = df['Al2O3'] / (df['Fe2O3'] + 0.01)
        df['Fineness_Residue_ratio'] = df['Fineness(cm2/g)'] / (df['Residue 45µm(%)'] + 0.01)
        df['CaO_Al2O3_ratio'] = df['CaO'] / (df['Al2O3'] + 0.01)
        df['SiO2_Fe2O3_ratio'] = df['SiO2'] / (df['Fe2O3'] + 0.01)
        
        # 3. Aggregate Features
        df['Total_Oxides'] = df['SiO2'] + df['Al2O3'] + df['Fe2O3'] + df['CaO'] + df['MgO']
        df['Total_Alkalis'] = df['K20'] + df['Na2O']
        df['Total_Impurities'] = df['MgO'] + df['SO3'] + df['Cl']
        
        # 4. Time-based features
        df['Grinding_Duration'] = df['Final (min)'] - df['Initial (min)']
        df['Grinding_Intensity'] = df['Grinding_Duration'] * df['Fineness(cm2/g)']
        
        # 5. Polynomial features
        df['CaO_squared'] = df['CaO'] ** 2
        df['SiO2_squared'] = df['SiO2'] ** 2
        df['Fineness_squared'] = df['Fineness(cm2/g)'] ** 2
        df['Al2O3_squared'] = df['Al2O3'] ** 2
        
        # 6. Cube root transformations
        df['CaO_cbrt'] = np.cbrt(df['CaO'])
        df['SiO2_cbrt'] = np.cbrt(df['SiO2'])
        df['Fineness_cbrt'] = np.cbrt(df['Fineness(cm2/g)'])
        
        # 7. Logarithmic transformations
        df['Fineness_log'] = np.log1p(df['Fineness(cm2/g)'])
        df['CaO_log'] = np.log1p(df['CaO'])
        
        # 8. Cross-product features
        df['CaO_Fineness'] = df['CaO'] * df['Fineness(cm2/g)']
        df['SiO2_Fineness'] = df['SiO2'] * df['Fineness(cm2/g)']
        
        return df
    
    def predict(self, input_data: Dict[str, float]) -> Dict[str, float]:
        """Make ensemble predictions for all strength targets"""
        if not self.models_loaded:
            self.load_models()
            
        if not self.models_loaded:
            raise ValueError("Models not loaded. Please ensure model files are present.")
        
        # Apply feature engineering
        df_features = self.engineer_features(input_data)
        
        # Ensure all expected features are present
        missing_features = [f for f in self.feature_columns if f not in df_features.columns]
        for feature in missing_features:
            df_features[feature] = 0
            
        # Reorder columns to match training
        X = df_features[self.feature_columns]
        
        # Make predictions for each target
        predictions = {}
        
        for target in self.target_columns:
            # Get predictions from both models
            xgb_pred = self.xgb_models[target].predict(X)[0]
            lgb_pred = self.lgb_models[target].predict(X)[0]
            
            # Get ensemble weights
            weights = self.ensemble_weights.get(target, {'xgb': 0.5, 'lgb': 0.5})
            w_xgb = weights.get('xgb', 0.5)
            w_lgb = weights.get('lgb', 0.5)
            
            # Ensemble prediction
            ensemble_pred = w_xgb * xgb_pred + w_lgb * lgb_pred
            
            # Store prediction
            predictions[target] = float(ensemble_pred)
        
        return predictions


# Global instance
_model_service = None


def get_model_service() -> HirumiModelService:
    """Get or create model service instance"""
    global _model_service
    if _model_service is None:
        _model_service = HirumiModelService()
        _model_service.load_models()
    return _model_service
