import React from 'react';
import { calculateProgressPercentage } from '../../utils/statusUtils';
import { CheckIcon } from '@heroicons/react/24/outline';

/**
 * A consistent progress bar component showing order workflow stages with status indicators
 * 
 * @param {Object} props
 * @param {Object} props.order 
 * @param {string} props.className 
 */
const OrderProgressBar = ({ order, className = '' }) => {
  if (!order) return null;
  
  const stages = [
    { label: 'Submission', status: 'Completed', completed: true },
    {
      label: 'Design',
      status:
        order.status === 'Designing'
          ? 'In Progress'
          : ['In Prepress', 'Ready for Delivery', 'Completed'].includes(order.status) ||
            order.stages?.production?.status === 'Completed'
          ? 'Completed'
          : 'Pending',
      completed:
        ['In Prepress', 'Ready for Delivery', 'Completed'].includes(order.status) ||
        order.stages?.production?.status === 'Completed',
    },
    {
      label: 'Ripping',
      status:
        order.stages?.production?.subProcesses?.ripping?.status === 'Completed'
          ? 'Completed'
          : order.status === 'Designing'
          ? 'Pending'
          : order.status === 'In Prepress'
          ? 'Completed'
          : order.stages?.production?.status === 'Completed'
          ? 'Completed'
          : 'Pending',
      completed:
        order.stages?.production?.subProcesses?.ripping?.status === 'Completed' ||
        order.status === 'In Prepress',
    },
    {
      label: 'Prepress',
      status:
        order.stages?.prepress?.status === 'Completed'
          ? 'Completed'
          : order.stages?.prepress?.status === 'In Progress'
          ? 'In Prepress'
          : ['Ready for Delivery'].includes(order.status)
          ? 'Completed'
          : 'Pending',
      completed:
        ['Ready for Delivery', 'Completed'].includes(order.status) ||
        order.stages?.prepress?.status === 'Completed',
    },
    {
      label: 'Delivery',
      status:
        order.stages?.delivery?.status === 'Completed' || order.status === 'Completed'
          ? 'Completed'
          : order.stages?.delivery?.status === 'In Progress'
          ? 'In Progress'
          : 'Pending',
      completed: order.stages?.delivery?.status === 'Completed' || order.status === 'Completed',
    },
  ];
  
  // Calculate how many stages are complete (0-4)
  const completedStages = stages.filter(stage => stage.completed).length;
  
  // Calculate progress percentage (0-100)
  const progressPercentage = (completedStages / stages.length) * 100;
  
  // Calculate if any stage is in progress but not completed
  const currentStageIndex = stages.findIndex(stage => !stage.completed);
  const hasInProgressStage = currentStageIndex >= 0 && 
                             (stages[currentStageIndex].status === 'In Progress' || 
                              stages[currentStageIndex].status === 'In Prepress');
  
  // Add extra progress for in-progress stages (half a stage)
  const adjustedProgressPercentage = hasInProgressStage ? 
    progressPercentage + (100 / stages.length) / 2 : 
    progressPercentage;
  
  return (
    <div className={`w-full container-stable ${className}`}>
      {/* Progress bar */}
      <div className="relative mb-1">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ 
              width: `${adjustedProgressPercentage}%`,
              willChange: 'width',
              transform: 'translateZ(0)'
            }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
          ></div>
        </div>
        
        {/* Stage indicators */}
        <div className="grid grid-cols-5 mt-2 gap-1">
          {stages.map((stage, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-700">{stage.label}</span>
              <div className="flex items-center mt-1">
                {stage.completed ? (
                  <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : null}
                <span className={`text-xs ${
                  stage.status === 'Completed' ? 'text-green-500' : 
                  stage.status === 'In Progress' || stage.status === 'In Prepress' ? 'text-blue-500' : 
                  'text-gray-400'
                }`}>
                  {stage.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderProgressBar; 