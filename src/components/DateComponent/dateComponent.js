import React from 'react';
export default class DateComponent extends React.Component {
    render() {
        return (
            <div className="date">
                <input type="text" placeholder={new Date().toString()}/>
                {new Date().toString()}
            </div>
        );
    }
}