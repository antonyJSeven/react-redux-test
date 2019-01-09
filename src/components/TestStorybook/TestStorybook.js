import React from 'react'
import PropTypes from 'prop-types'

import '@elf/polyfills';
import '@elf/coral-button'; // Element
import '@elf/coral-item'; // Element
import '@elf/coral-collapse'; // Element
import '@elf/elf-theme-elemental/light/coral-button';
import '@elf/elf-theme-elemental/light/coral-collapse';
import '@elf/elf-theme-elemental/light/coral-item';

const User = ({name, id}) =>
    <>
        <span>{name}</span>
        <span>{id}</span>
    </>;

 const usersArray = [
     {name: 'Antony', category: 'Dev', id: 1},
     {name: 'Nikita', category: 'Dev', id: 2},
     {name: 'Liza', category: 'TM', id: 3},
     {name: 'Dasha', category: 'QA', id: 4},
     {name: 'Misha', category: 'QA', id: 5},
 ];

 // const sortBy = (a, b, param) => {
 //     if (a.param > b.param) return 1;
 //     if (a.param < b.param) return -1;
 //     return 0;
 // };

const CoralCollapseWrapper = (props) => {
    let prevCat;
    return props.users.map((elem, index) => {
        // if (prevCat === elem.category) {
            console.log(props.users);
            return (<coral-item key={elem.id}>
                <div className="notes" slot='left'>
                    <User name={elem.name} id={elem.category}/>
                </div>
                <div className="notes" slot='center'>{elem.category}</div>
            </coral-item>)
        // } else {
        //     return <CoralCollapseWrapper
        //         users={props.users.slice(index + 1)}>
        //     </CoralCollapseWrapper>
        // }
    })
};

export const TestStorybook = ({color, title, border}) => (
    <div>
        {/*<coral-item>*/}
            {/*<div className="notes" slot='center'>Small bag</div>*/}
            {/*<coral-button toggles icon="bin"></coral-button>*/}
        {/*</coral-item>*/}

        {/*<coral-collapse spacing header="Section 1">*/}
            {/*<div>*/}
                {/*Beans, breve galão froth arabica wings seasonal. Medium, galão redeye single origin brewed rich flavour as crema.*/}
            {/*</div>*/}
        {/*</coral-collapse>*/}
        <CoralCollapseWrapper users={usersArray}/>
        <coral-button>Button</coral-button>
        <button style={{background:color, border: border ? '3px solid black' : null}}>
            {title}
        </button>
    </div>
);

TestStorybook.propTypes = {
    background: PropTypes.string,
    title: PropTypes.string,
    border: PropTypes.bool
};

TestStorybook.defaultProps = {
    title: 'No title has been received'
};

