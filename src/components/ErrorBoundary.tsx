"use client";
import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError && this.state.error) {
            return (
                <div style={{padding:'2rem', background:'red', color:'white', fontSize:'14px', zIndex: 99999, position: 'relative'}}>
                    <h2>React Crash!</h2>
                    <p>{this.state.error.message}</p>
                    <pre style={{whiteSpace:'pre-wrap'}}>{this.state.error.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
