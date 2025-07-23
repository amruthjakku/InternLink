import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { CohortManagementTab } from './CohortManagementTab';
import { CohortAssignmentTab } from './CohortAssignmentTab';
import { CohortCollegesTab } from './CohortCollegesTab';

const CombinedCohortSystem = () => {
  const tabs = [
    { name: 'Cohort Management', component: <CohortManagementTab /> },
    { name: 'Member Assignment', component: <CohortAssignmentTab /> },
    { name: 'College Associations', component: <CohortCollegesTab /> }
  ];

  return (
    <div className="space-y-6">
      <Tab.Group>
        <Tab.List className="flex space-x-4 border-b">
          {tabs.map((tab) => (
            <Tab key={tab.name} className={({ selected }) =>
              selected ? 'bg-blue-500 text-white px-3 py-2 rounded-md' : 'text-blue-500 px-3 py-2'}
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx} className="pt-6">
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default CombinedCohortSystem;
