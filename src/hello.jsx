// @flow

import React from 'react';

type HelloProps = {
  name: String
}

export default function Hello({name} : HelloProps) {
  return <h1>Hello {name}</h1>
};
