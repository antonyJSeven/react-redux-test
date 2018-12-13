import React, { Component } from 'react';
import { connect } from 'react-redux';

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/elf-theme-elemental/light/coral-button';

export class ProfileComponent extends Component {

    render() {
        return (
            <div>
            <coral-button>Hello from Profile Component</coral-button>
           <pre>this.props</pre>
            </div>
        )
    }

}

// const mapStateToProps = function(state) {
//     return {
//         profile: state.profile
//     }
// };
//
// export default connect(mapStateToProps)(ProfileComponent);
