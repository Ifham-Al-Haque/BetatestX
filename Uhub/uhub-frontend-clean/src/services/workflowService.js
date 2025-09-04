// Advanced workflow service for IT requests
import { supabase } from '../supabaseClient';
import { emailService } from './emailService';

class WorkflowService {
  constructor() {
    this.workflowTemplates = {
      standard: {
        name: 'Standard IT Request',
        description: 'Standard workflow for general IT requests',
        steps: [
          {
            id: 'submission',
            name: 'Request Submission',
            type: 'automatic',
            status: 'open',
            required: true,
            autoTransition: true
          },
          {
            id: 'review',
            name: 'IT Review',
            type: 'manual',
            status: 'assigned',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'approval',
            name: 'Approval',
            type: 'conditional',
            status: 'pending_approval',
            required: false,
            conditions: {
              priority: ['critical', 'high'],
              category: ['hardware', 'software']
            },
            assignableRoles: ['admin'],
            autoTransition: false
          },
          {
            id: 'implementation',
            name: 'Implementation',
            type: 'manual',
            status: 'in_progress',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'testing',
            name: 'Testing & Validation',
            type: 'manual',
            status: 'pending_user',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'resolution',
            name: 'Resolution',
            type: 'manual',
            status: 'resolved',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'closure',
            name: 'Closure',
            type: 'automatic',
            status: 'closed',
            required: true,
            autoTransition: true,
            delay: 24 // hours
          }
        ]
      },
      emergency: {
        name: 'Emergency Request',
        description: 'Fast-track workflow for critical issues',
        steps: [
          {
            id: 'submission',
            name: 'Emergency Submission',
            type: 'automatic',
            status: 'open',
            required: true,
            autoTransition: true
          },
          {
            id: 'immediate_response',
            name: 'Immediate Response',
            type: 'manual',
            status: 'assigned',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false,
            sla: 1 // 1 hour SLA
          },
          {
            id: 'resolution',
            name: 'Emergency Resolution',
            type: 'manual',
            status: 'resolved',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false,
            sla: 4 // 4 hours SLA
          },
          {
            id: 'closure',
            name: 'Closure',
            type: 'automatic',
            status: 'closed',
            required: true,
            autoTransition: true,
            delay: 2 // 2 hours
          }
        ]
      },
      hardware: {
        name: 'Hardware Request',
        description: 'Workflow for hardware procurement and setup',
        steps: [
          {
            id: 'submission',
            name: 'Request Submission',
            type: 'automatic',
            status: 'open',
            required: true,
            autoTransition: true
          },
          {
            id: 'budget_approval',
            name: 'Budget Approval',
            type: 'manual',
            status: 'pending_approval',
            required: true,
            assignableRoles: ['admin', 'finance'],
            autoTransition: false
          },
          {
            id: 'procurement',
            name: 'Procurement',
            type: 'manual',
            status: 'in_progress',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'delivery',
            name: 'Delivery & Setup',
            type: 'manual',
            status: 'in_progress',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'user_acceptance',
            name: 'User Acceptance',
            type: 'manual',
            status: 'pending_user',
            required: true,
            autoTransition: false
          },
          {
            id: 'resolution',
            name: 'Resolution',
            type: 'manual',
            status: 'resolved',
            required: true,
            assignableRoles: ['it_management', 'admin'],
            autoTransition: false
          },
          {
            id: 'closure',
            name: 'Closure',
            type: 'automatic',
            status: 'closed',
            required: true,
            autoTransition: true,
            delay: 48 // 48 hours
          }
        ]
      }
    };
  }

  // Get workflow template by name
  getWorkflowTemplate(templateName) {
    return this.workflowTemplates[templateName] || this.workflowTemplates.standard;
  }

  // Determine workflow template based on request data
  determineWorkflowTemplate(request) {
    // Emergency workflow for critical priority
    if (request.priority?.level === 1) {
      return 'emergency';
    }

    // Hardware workflow for hardware category
    if (request.category?.name?.toLowerCase().includes('hardware')) {
      return 'hardware';
    }

    // Standard workflow for everything else
    return 'standard';
  }

  // Initialize workflow for a request
  async initializeWorkflow(requestId, requestData) {
    try {
      const templateName = this.determineWorkflowTemplate(requestData);
      const template = this.getWorkflowTemplate(templateName);
      
      const workflow = {
        request_id: requestId,
        template_name: templateName,
        current_step: 0,
        status: 'active',
        steps_completed: [],
        steps_pending: template.steps.map((step, index) => ({
          ...step,
          step_index: index,
          status: index === 0 ? 'active' : 'pending',
          started_at: index === 0 ? new Date().toISOString() : null,
          completed_at: null,
          assigned_to: null,
          notes: null
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('it_request_workflows')
        .insert([workflow])
        .select()
        .single();

      if (error) throw error;

      // Process first step if it's automatic
      const firstStep = workflow.steps_pending[0];
      if (firstStep.autoTransition) {
        await this.processStep(requestId, firstStep.id, {});
      }

      return data;
    } catch (error) {
      console.error('Error initializing workflow:', error);
      throw error;
    }
  }

  // Process a workflow step
  async processStep(requestId, stepId, stepData) {
    try {
      // Get current workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('it_request_workflows')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (workflowError) throw workflowError;

      // Find the step
      const stepIndex = workflow.steps_pending.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Step ${stepId} not found in workflow`);
      }

      const step = workflow.steps_pending[stepIndex];
      
      // Update step status
      const updatedSteps = [...workflow.steps_pending];
      updatedSteps[stepIndex] = {
        ...step,
        status: 'completed',
        completed_at: new Date().toISOString(),
        assigned_to: stepData.assigned_to || step.assigned_to,
        notes: stepData.notes || step.notes
      };

      // Move to next step
      const nextStepIndex = stepIndex + 1;
      if (nextStepIndex < updatedSteps.length) {
        updatedSteps[nextStepIndex] = {
          ...updatedSteps[nextStepIndex],
          status: 'active',
          started_at: new Date().toISOString()
        };
      }

      // Update workflow
      const { data: updatedWorkflow, error: updateError } = await supabase
        .from('it_request_workflows')
        .update({
          current_step: nextStepIndex,
          steps_pending: updatedSteps,
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update request status
      await this.updateRequestStatus(requestId, step.status);

      // Process next step if it's automatic
      if (nextStepIndex < updatedSteps.length) {
        const nextStep = updatedSteps[nextStepIndex];
        if (nextStep.autoTransition) {
          setTimeout(() => {
            this.processStep(requestId, nextStep.id, {});
          }, nextStep.delay ? nextStep.delay * 60 * 60 * 1000 : 0); // Convert hours to milliseconds
        }
      }

      // Send notifications
      await this.sendWorkflowNotifications(requestId, step, stepData);

      return updatedWorkflow;
    } catch (error) {
      console.error('Error processing workflow step:', error);
      throw error;
    }
  }

  // Update request status
  async updateRequestStatus(requestId, status) {
    try {
      const { error } = await supabase
        .from('it_requests')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  // Send workflow notifications
  async sendWorkflowNotifications(requestId, step, stepData) {
    try {
      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('it_requests')
        .select(`
          *,
          requester:requester_id(full_name, email),
          assignee:assigned_to(full_name, email),
          category:category_id(name),
          priority:priority_id(name, level)
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Send notifications based on step type
      switch (step.type) {
        case 'manual':
          await this.notifyManualStep(request, step, stepData);
          break;
        case 'conditional':
          await this.notifyConditionalStep(request, step, stepData);
          break;
        case 'automatic':
          await this.notifyAutomaticStep(request, step, stepData);
          break;
      }
    } catch (error) {
      console.error('Error sending workflow notifications:', error);
    }
  }

  // Notify manual step
  async notifyManualStep(request, step, stepData) {
    const assignableUsers = await this.getAssignableUsers(step.assignableRoles);
    
    for (const user of assignableUsers) {
      await emailService.sendNotification('assignmentNotification', {
        requestNumber: request.request_number || `#${request.id}`,
        title: request.title,
        assignedTo: user.full_name,
        priority: request.priority?.name || 'Unknown',
        assignedBy: 'System',
        assignedAt: new Date().toLocaleString(),
        requestUrl: `${window.location.origin}/it-requests?view=${request.id}`,
        stepName: step.name,
        stepDescription: `Please complete: ${step.name}`
      }, [user.email]);
    }
  }

  // Notify conditional step
  async notifyConditionalStep(request, step, stepData) {
    // Check if conditions are met
    const conditionsMet = this.checkConditions(request, step.conditions);
    
    if (conditionsMet) {
      await this.notifyManualStep(request, step, stepData);
    } else {
      // Skip this step
      await this.processStep(request.id, step.id, { skip: true });
    }
  }

  // Notify automatic step
  async notifyAutomaticStep(request, step, stepData) {
    // Send notification to requester about automatic progress
    if (request.requester?.email) {
      await emailService.sendNotification('statusChanged', {
        requestNumber: request.request_number || `#${request.id}`,
        title: request.title,
        previousStatus: 'Previous',
        newStatus: step.status,
        statusColor: emailService.getStatusColor(step.status),
        updatedBy: 'System',
        updatedAt: new Date().toLocaleString(),
        requestUrl: `${window.location.origin}/it-requests?view=${request.id}`,
        stepName: step.name,
        stepDescription: `Automatically completed: ${step.name}`
      }, [request.requester.email]);
    }
  }

  // Check workflow conditions
  checkConditions(request, conditions) {
    if (!conditions) return true;

    // Check priority conditions
    if (conditions.priority) {
      const requestPriority = request.priority?.name?.toLowerCase();
      if (!conditions.priority.includes(requestPriority)) {
        return false;
      }
    }

    // Check category conditions
    if (conditions.category) {
      const requestCategory = request.category?.name?.toLowerCase();
      if (!conditions.category.includes(requestCategory)) {
        return false;
      }
    }

    return true;
  }

  // Get assignable users for roles
  async getAssignableUsers(roles) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, role')
        .in('role', roles)
        .not('email', 'is', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assignable users:', error);
      return [];
    }
  }

  // Get workflow status for a request
  async getWorkflowStatus(requestId) {
    try {
      const { data, error } = await supabase
        .from('it_request_workflows')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      return null;
    }
  }

  // Get all active workflows
  async getActiveWorkflows() {
    try {
      const { data, error } = await supabase
        .from('it_request_workflows')
        .select(`
          *,
          request:it_requests(
            id, title, status, created_at,
            requester:requester_id(full_name, email),
            category:category_id(name),
            priority:priority_id(name, level)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active workflows:', error);
      return [];
    }
  }

  // Create custom workflow template
  async createCustomWorkflow(templateData) {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert([{
          name: templateData.name,
          description: templateData.description,
          steps: templateData.steps,
          created_by: templateData.created_by,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating custom workflow:', error);
      throw error;
    }
  }

  // Get workflow analytics
  async getWorkflowAnalytics(dateRange = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateRange);

      const { data, error } = await supabase
        .from('it_request_workflows')
        .select(`
          *,
          request:it_requests(
            id, status, created_at, resolved_at,
            category:category_id(name),
            priority:priority_id(name, level)
          )
        `)
        .gte('created_at', cutoffDate.toISOString());

      if (error) throw error;

      // Calculate analytics
      const analytics = {
        totalWorkflows: data.length,
        completedWorkflows: data.filter(w => w.status === 'completed').length,
        activeWorkflows: data.filter(w => w.status === 'active').length,
        averageCompletionTime: this.calculateAverageCompletionTime(data),
        stepAnalytics: this.calculateStepAnalytics(data),
        templateBreakdown: this.calculateTemplateBreakdown(data)
      };

      return analytics;
    } catch (error) {
      console.error('Error fetching workflow analytics:', error);
      throw error;
    }
  }

  // Calculate average completion time
  calculateAverageCompletionTime(workflows) {
    const completedWorkflows = workflows.filter(w => w.status === 'completed');
    if (completedWorkflows.length === 0) return 0;

    const totalTime = completedWorkflows.reduce((sum, workflow) => {
      const start = new Date(workflow.created_at);
      const end = new Date(workflow.updated_at);
      return sum + (end - start);
    }, 0);

    return Math.round(totalTime / completedWorkflows.length / (1000 * 60 * 60)); // hours
  }

  // Calculate step analytics
  calculateStepAnalytics(workflows) {
    const stepStats = {};
    
    workflows.forEach(workflow => {
      workflow.steps_pending.forEach(step => {
        if (!stepStats[step.id]) {
          stepStats[step.id] = {
            name: step.name,
            total: 0,
            completed: 0,
            averageTime: 0
          };
        }
        
        stepStats[step.id].total++;
        if (step.status === 'completed') {
          stepStats[step.id].completed++;
        }
      });
    });

    return stepStats;
  }

  // Calculate template breakdown
  calculateTemplateBreakdown(workflows) {
    const templateStats = {};
    
    workflows.forEach(workflow => {
      if (!templateStats[workflow.template_name]) {
        templateStats[workflow.template_name] = 0;
      }
      templateStats[workflow.template_name]++;
    });

    return templateStats;
  }
}

export const workflowService = new WorkflowService();
