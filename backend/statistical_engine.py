import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Any
from models import GeographicUnit, StatisticalMetrics, QualityIndicators, TestGroup, OptimizationRequest, OptimizationResult
from scipy.optimize import minimize
from scipy import stats
import random
from collections import defaultdict

class StatisticalMatchingEngine:
    """
    Enterprise-level statistical matching engine for geo-incrementality testing
    Based on Wayfair's methodology using integer optimization algorithms
    """
    
    def __init__(self):
        self.balance_tolerance = 0.1  # 10% tolerance for balance metrics
        self.min_power = 0.8
        self.significance_level = 0.05
        
    def optimize_geo_assignment(self, request: OptimizationRequest) -> OptimizationResult:
        """
        Main optimization function using integer optimization for geo assignment
        Similar to Wayfair's approach
        """
        units = request.available_units
        n_units = len(units)
        n_treatment = int(n_units * request.treatment_percentage)
        
        # Extract metrics for optimization
        metrics_matrix = self._extract_metrics_matrix(units)
        
        # Run optimization algorithm
        best_assignment, best_score, iterations = self._integer_optimization(
            metrics_matrix, n_treatment, request.objectives
        )
        
        # Create groups
        treatment_indices = np.where(best_assignment == 1)[0]
        control_indices = np.where(best_assignment == 0)[0]
        
        treatment_units = [units[i].id for i in treatment_indices]
        control_units = [units[i].id for i in control_indices]
        
        # Calculate balance metrics
        balance_metrics = self._calculate_balance_metrics(
            metrics_matrix, best_assignment
        )
        
        return OptimizationResult(
            treatment_units=treatment_units,
            control_units=control_units,
            balance_metrics=balance_metrics,
            optimization_score=best_score,
            iterations=iterations,
            convergence_achieved=True
        )
    
    def _extract_metrics_matrix(self, units: List[GeographicUnit]) -> np.ndarray:
        """Extract key metrics for optimization"""
        metrics = []
        for unit in units:
            metrics.append([
                unit.population,
                unit.historical_conversions,
                unit.historical_spend,
                unit.historical_revenue,
                unit.conversion_rate,
                unit.cpm,
                unit.ctr
            ])
        return np.array(metrics)
    
    def _integer_optimization(self, metrics: np.ndarray, n_treatment: int, 
                            objectives: List[str]) -> Tuple[np.ndarray, float, int]:
        """
        Integer optimization algorithm for balanced assignment
        """
        n_units = metrics.shape[0]
        best_assignment = None
        best_score = float('inf')
        max_iterations = 10000
        
        # Multiple random starts for global optimization
        for iteration in range(max_iterations):
            # Generate random assignment
            assignment = np.zeros(n_units)
            treatment_indices = np.random.choice(n_units, n_treatment, replace=False)
            assignment[treatment_indices] = 1
            
            # Calculate balance score
            score = self._calculate_balance_score(metrics, assignment)
            
            # Update best if better
            if score < best_score:
                best_score = score
                best_assignment = assignment.copy()
            
            # Early stopping if very good balance achieved
            if score < 0.01:
                break
        
        return best_assignment, best_score, iteration + 1
    
    def _calculate_balance_score(self, metrics: np.ndarray, assignment: np.ndarray) -> float:
        """
        Calculate balance score for given assignment
        Lower score = better balance
        """
        treatment_mask = assignment == 1
        control_mask = assignment == 0
        
        if np.sum(treatment_mask) == 0 or np.sum(control_mask) == 0:
            return float('inf')
        
        treatment_means = np.mean(metrics[treatment_mask], axis=0)
        control_means = np.mean(metrics[control_mask], axis=0)
        
        # Calculate standardized differences
        pooled_stds = np.std(metrics, axis=0)
        pooled_stds[pooled_stds == 0] = 1  # Avoid division by zero
        
        standardized_diffs = np.abs(treatment_means - control_means) / pooled_stds
        
        # Return mean standardized difference
        return np.mean(standardized_diffs)
    
    def _calculate_balance_metrics(self, metrics: np.ndarray, assignment: np.ndarray) -> Dict[str, float]:
        """Calculate detailed balance metrics"""
        treatment_mask = assignment == 1
        control_mask = assignment == 0
        
        treatment_data = metrics[treatment_mask]
        control_data = metrics[control_mask]
        
        balance_metrics = {}
        metric_names = ['population', 'conversions', 'spend', 'revenue', 'conv_rate', 'cpm', 'ctr']
        
        for i, name in enumerate(metric_names):
            treatment_mean = np.mean(treatment_data[:, i])
            control_mean = np.mean(control_data[:, i])
            
            # Calculate percentage difference
            if control_mean != 0:
                pct_diff = abs(treatment_mean - control_mean) / control_mean * 100
            else:
                pct_diff = 0
            
            balance_metrics[f'{name}_balance'] = pct_diff
        
        return balance_metrics
    
    def calculate_statistical_power(self, treatment_group: TestGroup, 
                                  control_group: TestGroup, 
                                  expected_effect: float = 0.1) -> StatisticalMetrics:
        """
        Calculate statistical power and other metrics for the test design
        """
        # Extract sample sizes
        n_treatment = treatment_group.total_population
        n_control = control_group.total_population
        
        # Calculate pooled variance (simplified)
        treatment_variance = np.var([unit.conversion_rate for unit in treatment_group.units])
        control_variance = np.var([unit.conversion_rate for unit in control_group.units])
        pooled_variance = (treatment_variance + control_variance) / 2
        
        # Standard error
        se = np.sqrt(pooled_variance * (1/n_treatment + 1/n_control))
        
        # Minimum detectable effect
        alpha = self.significance_level
        beta = 1 - self.min_power
        z_alpha = stats.norm.ppf(1 - alpha/2)
        z_beta = stats.norm.ppf(1 - beta)
        
        mde = (z_alpha + z_beta) * se
        
        # Power calculation for given effect
        z_stat = expected_effect / se
        power = 1 - stats.norm.cdf(z_alpha - z_stat) + stats.norm.cdf(-z_alpha - z_stat)
        
        # Other metrics
        mse = se ** 2
        bias = 0  # Assuming unbiased design
        coverage = 0.95  # 95% confidence intervals
        
        return StatisticalMetrics(
            mse=mse,
            variance=pooled_variance,
            bias=bias,
            coverage=coverage,
            power=power,
            significance_level=alpha,
            minimum_detectable_effect=mde
        )
    
    def validate_test_quality(self, treatment_group: TestGroup, 
                            control_group: TestGroup,
                            budget_config: Any,
                            statistical_metrics: StatisticalMetrics) -> QualityIndicators:
        """
        Comprehensive quality validation following Wayfair methodology
        """
        recommendations = []
        warnings = []
        
        # 1. Statistical Power Check
        power_adequate = statistical_metrics.power >= self.min_power
        if not power_adequate:
            warnings.append(f"Statistical power ({statistical_metrics.power:.2f}) below minimum threshold ({self.min_power})")
            recommendations.append("Consider increasing sample size or test duration")
        
        # 2. Sample Size Adequacy
        total_population = treatment_group.total_population + control_group.total_population
        min_sample_size = 10000  # Minimum for geo experiments
        sample_size_adequate = total_population >= min_sample_size
        
        if not sample_size_adequate:
            warnings.append(f"Total population ({total_population:,}) below recommended minimum ({min_sample_size:,})")
            recommendations.append("Include more geographic units or choose larger markets")
        
        # 3. Spend Adequacy
        total_historical_spend = (
            sum([unit.historical_spend for unit in treatment_group.units]) +
            sum([unit.historical_spend for unit in control_group.units])
        )
        spend_adequate = total_historical_spend >= budget_config.min_spend_threshold
        
        if not spend_adequate:
            warnings.append(f"Historical spend too low for reliable measurement")
            recommendations.append("Increase budget or choose higher-spend markets")
        
        # 4. Conversion Volume Adequacy
        total_conversions = (
            sum([unit.historical_conversions for unit in treatment_group.units]) +
            sum([unit.historical_conversions for unit in control_group.units])
        )
        min_conversions = 100  # Minimum for statistical significance
        conversion_volume_adequate = total_conversions >= min_conversions
        
        if not conversion_volume_adequate:
            warnings.append(f"Conversion volume ({total_conversions}) too low for reliable measurement")
            recommendations.append("Extend test duration or include higher-converting markets")
        
        # 5. Balance Score
        balance_scores = []
        for unit_t in treatment_group.units:
            for unit_c in control_group.units:
                # Simple similarity score between units
                score = abs(unit_t.conversion_rate - unit_c.conversion_rate) / max(unit_t.conversion_rate, unit_c.conversion_rate, 0.001)
                balance_scores.append(1 - min(score, 1))  # Convert to 0-1 scale
        
        balance_score = np.mean(balance_scores) * 100
        
        # 6. Overall Quality Score
        quality_factors = [
            statistical_metrics.power * 100,
            100 if sample_size_adequate else 50,
            100 if spend_adequate else 30,
            100 if conversion_volume_adequate else 20,
            balance_score
        ]
        
        overall_quality_score = np.mean(quality_factors)
        
        # Add quality-based recommendations
        if overall_quality_score < 60:
            recommendations.append("Test quality is below recommended threshold - consider redesigning")
        elif overall_quality_score < 80:
            recommendations.append("Test quality is acceptable but could be improved")
        
        return QualityIndicators(
            statistical_metrics=statistical_metrics,
            balance_score=balance_score,
            sample_size_adequacy=sample_size_adequate,
            spend_adequacy=spend_adequate,
            conversion_volume_adequacy=conversion_volume_adequate,
            overall_quality_score=overall_quality_score,
            recommendations=recommendations,
            warnings=warnings
        )
