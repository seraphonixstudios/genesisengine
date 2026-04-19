const { v4: uuidv4 } = require('uuid');

// In-memory job queue for standalone mode
class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.processing = new Map();
    this.completed = new Map();
    this.failed = new Map();
    this.processors = new Map();
    this.maxConcurrent = 3;
    this.running = 0;
  }

  async addJob(type, data, options = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type,
      data,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: options.priority || 'normal',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      result: null,
      error: null
    };

    this.jobs.set(jobId, job);
    
    // Process queue
    this.processQueue();
    
    return job;
  }

  async processQueue() {
    if (this.running >= this.maxConcurrent) {
      return;
    }

    // Get pending jobs sorted by priority
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    for (const job of pendingJobs) {
      if (this.running >= this.maxConcurrent) {
        break;
      }

      this.running++;
      this.processJob(job);
    }
  }

  async processJob(job) {
    const processor = this.processors.get(job.type);
    
    if (!processor) {
      job.status = 'failed';
      job.error = `No processor registered for type: ${job.type}`;
      job.updatedAt = new Date().toISOString();
      this.failed.set(job.id, job);
      this.running--;
      this.processQueue();
      return;
    }

    job.status = 'processing';
    job.attempts++;
    job.updatedAt = new Date().toISOString();
    this.processing.set(job.id, job);

    try {
      // Progress callback
      const onProgress = (progress) => {
        job.progress = progress;
        job.updatedAt = new Date().toISOString();
        this.jobs.set(job.id, job);
      };

      const result = await processor(job.data, onProgress);
      
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.updatedAt = new Date().toISOString();
      
      this.completed.set(job.id, job);
      this.processing.delete(job.id);
      this.jobs.set(job.id, job);
      
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      if (job.attempts < job.maxAttempts) {
        // Retry
        job.status = 'pending';
        job.error = error.message;
        job.updatedAt = new Date().toISOString();
        this.processing.delete(job.id);
        
        // Delay before retry
        setTimeout(() => {
          this.processQueue();
        }, 5000);
      } else {
        // Max attempts reached
        job.status = 'failed';
        job.error = error.message;
        job.updatedAt = new Date().toISOString();
        
        this.failed.set(job.id, job);
        this.processing.delete(job.id);
        this.jobs.set(job.id, job);
      }
    }

    this.running--;
    this.processQueue();
  }

  registerProcessor(type, processor) {
    this.processors.set(type, processor);
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      result: job.status === 'completed' ? job.result : null,
      error: job.status === 'failed' ? job.error : null
    };
  }

  async getJobsByType(type, limit = 50) {
    return Array.from(this.jobs.values())
      .filter(job => job.type === type)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'pending') {
      job.status = 'cancelled';
      job.updatedAt = new Date().toISOString();
      this.jobs.set(jobId, job);
      return true;
    }

    return false;
  }

  getStats() {
    const allJobs = Array.from(this.jobs.values());
    return {
      total: allJobs.length,
      pending: allJobs.filter(j => j.status === 'pending').length,
      processing: allJobs.filter(j => j.status === 'processing').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
      failed: allJobs.filter(j => j.status === 'failed').length,
      running: this.running
    };
  }
}

// Create global queue instance
const jobQueue = new JobQueue();

// Register generation processor
const { 
  generateWithHuggingFace,
  generateWithOpenAI,
  generateWithStabilityAI,
  generateWithReplicate,
  enhancePrompt,
  getNegativePrompt
} = require('./generationProviders');

jobQueue.registerProcessor('generation', async (data, onProgress) => {
  onProgress(10);
  
  const {
    prompt,
    provider = 'huggingface',
    model,
    negativePrompt,
    seed,
    steps = 30,
    width = 1024,
    height = 1024,
    guidanceScale = 7.5,
    sampler,
    style = 'default',
    enhance = true
  } = data;

  onProgress(20);

  // Enhance prompt
  let finalPrompt = prompt;
  if (enhance) {
    finalPrompt = enhancePrompt(prompt, style, 'high');
  }

  onProgress(30);

  const params = {
    prompt: finalPrompt,
    negativePrompt: negativePrompt || getNegativePrompt(style),
    seed,
    steps,
    width,
    height,
    guidanceScale,
    sampler,
    style,
    model
  };

  onProgress(40);

  let result;
  switch (provider) {
    case 'openai':
      result = await generateWithOpenAI(finalPrompt, params);
      break;
    case 'stability':
      result = await generateWithStabilityAI(finalPrompt, params);
      break;
    case 'replicate':
      result = await generateWithReplicate(finalPrompt, params);
      break;
    case 'huggingface':
    default:
      result = await generateWithHuggingFace(finalPrompt, params);
      break;
  }

  onProgress(100);

  return result;
});

// Queue job helper function
async function queueJob(data) {
  return jobQueue.addJob('generation', data);
}

// Get job status helper function
async function getJobStatus(jobId) {
  return jobQueue.getJobStatus(jobId);
}

module.exports = {
  jobQueue,
  queueJob,
  getJobStatus
};
