/**
 * Agent API routes
 * 
 * This file defines API routes for interacting with the agent health system.
 */

import { Router } from 'express';
import { agentManager } from '../../shared/agent';
import { agentHealthRecovery } from '../../shared/agent/AgentHealthRecovery';

const router = Router();

/**
 * Get all agent health statuses
 * 
 * GET /api/agents/health
 */
router.get('/health', (req, res) => {
  try {
    const agentStatusList = agentManager.getAllAgentStatus();
    
    const healthyCount = agentStatusList.filter(s => s.healthy).length;
    const systemStatus = healthyCount === agentStatusList.length ? 'healthy' : 'degraded';
    
    res.json({
      status: systemStatus,
      healthy: healthyCount,
      total: agentStatusList.length,
      unhealthy: agentStatusList.length - healthyCount,
      agents: agentStatusList.map(status => ({
        id: status.id,
        healthy: status.healthy,
        active: status.active
      }))
    });
  } catch (error) {
    console.error('Error getting agent health:', error);
    res.status(500).json({ 
      error: 'Error getting agent health',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Recover an unhealthy agent
 * 
 * POST /api/agents/:id/recover
 */
router.post('/:id/recover', async (req, res) => {
  const { id } = req.params;
  
  try {
    const agent = agentManager.getAgent(id);
    const status = agentManager.getAgentStatus(id);
    
    if (!agent) {
      return res.status(404).json({ error: `Agent ${id} not found` });
    }
    
    if (!status) {
      return res.status(404).json({ error: `Status for agent ${id} not found` });
    }
    
    if (status.healthy) {
      return res.json({ 
        message: `Agent ${id} is already healthy`,
        success: true,
        agent: { id, healthy: true }
      });
    }
    
    const result = await agentHealthRecovery.recoverAgent(id, agent, status, {
      autoInitialize: true,
      forceHealthyStatus: true,
      maxAttempts: 3,
      cooldownMs: 1000
    });
    
    res.json({
      message: result.success 
        ? `Successfully recovered agent ${id}` 
        : `Failed to recover agent ${id}`,
      success: result.success,
      error: result.error,
      agent: {
        id,
        healthy: result.healthStatus,
        recoveryAttempts: result.attemptCount
      }
    });
  } catch (error) {
    console.error(`Error recovering agent ${id}:`, error);
    res.status(500).json({ 
      error: `Error recovering agent ${id}`,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Recover all unhealthy agents
 * 
 * POST /api/agents/recover-all
 */
router.post('/recover-all', async (req, res) => {
  try {
    const agentStatusList = agentManager.getAllAgentStatus();
    const unhealthyAgents = agentStatusList.filter(status => !status.healthy);
    
    if (unhealthyAgents.length === 0) {
      return res.json({
        message: 'All agents are healthy',
        success: true,
        recovered: 0,
        failed: 0,
        total: 0
      });
    }
    
    let successCount = 0;
    let failCount = 0;
    const results = [];
    
    // Recover each unhealthy agent
    for (const status of unhealthyAgents) {
      const agent = agentManager.getAgent(status.id);
      
      if (agent) {
        try {
          const result = await agentHealthRecovery.recoverAgent(status.id, agent, status, {
            autoInitialize: true,
            forceHealthyStatus: true,
            maxAttempts: 3,
            cooldownMs: 1000
          });
          
          results.push({
            id: status.id,
            success: result.success,
            error: result.error
          });
          
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          results.push({
            id: status.id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          failCount++;
        }
      } else {
        results.push({
          id: status.id,
          success: false,
          error: 'Agent not found'
        });
        failCount++;
      }
    }
    
    // Get updated status
    const updatedStatusList = agentManager.getAllAgentStatus();
    const remainingUnhealthy = updatedStatusList.filter(status => !status.healthy).length;
    
    res.json({
      message: `Recovered ${successCount} of ${unhealthyAgents.length} unhealthy agents`,
      success: failCount === 0,
      recovered: successCount,
      failed: failCount,
      total: unhealthyAgents.length,
      remaining: remainingUnhealthy,
      systemStatus: remainingUnhealthy === 0 ? 'healthy' : 'degraded',
      results
    });
  } catch (error) {
    console.error('Error recovering agents:', error);
    res.status(500).json({ 
      error: 'Error recovering agents',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;