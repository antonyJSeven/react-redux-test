// @flow

import React from 'react';

type HelloProps = {
  name: string
}

export default function Hello({ name } : HelloProps) {
  const output = name ? `Hello ${name}` : 'Hello';
  return (
    <h1>{output}</h1>
  );
}
