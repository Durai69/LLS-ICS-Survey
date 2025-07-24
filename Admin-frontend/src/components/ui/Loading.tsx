import React from 'react';
import { NewtonsCradle } from 'ldrs/react';
import 'ldrs/react/NewtonsCradle.css';

const Loading = () => {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white z-50">
      <NewtonsCradle size="78" speed="1.4" color="black" />
    </div>
  );
};

export default Loading;
