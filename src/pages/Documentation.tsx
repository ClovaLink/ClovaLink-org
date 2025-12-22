import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// Import markdown content using Vite's ?raw suffix
import homeMd from '../content/Home.md?raw';
import architectureMd from '../content/Architecture.md?raw';
import apiRefMd from '../content/API-Reference.md?raw';
import deployMd from '../content/Deployment-Guide.md?raw';
import adminMd from '../content/Admin-Guide.md?raw';
import securityMd from '../content/Security.md?raw';
import extensionsMd from '../content/Extensions-SDK.md?raw';

const docsMap: Record<string, { title: string; content: string }> = {
    'overview': { title: 'Overview', content: homeMd },
    'architecture': { title: 'Architecture', content: architectureMd },
    'api': { title: 'API Reference', content: apiRefMd },
    'deployment': { title: 'Deployment Guide', content: deployMd },
    'admin': { title: 'Admin Guide', content: adminMd },
    'security': { title: 'Security', content: securityMd },
    'extensions': { title: 'Extensions SDK', content: extensionsMd },
};

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const Documentation: React.FC = () => {
    return (
        <div className="docs-layout">
            <ScrollToTop />
            <aside className="docs-sidebar">
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Guides</h3>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(docsMap).map(([key, { title }]) => (
                        <NavLink
                            key={key}
                            to={`/docs/${key}`}
                            style={({ isActive }) => ({
                                padding: '0.5rem',
                                borderRadius: '6px',
                                color: isActive ? '#000' : '#666',
                                backgroundColor: isActive ? '#f5f5f5' : 'transparent',
                                fontWeight: isActive ? 600 : 400
                            })}
                        >
                            {title}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="docs-content">
                <Routes>
                    <Route path="/" element={<RedirectToOverview />} />
                    <Route path=":docId" element={<DocViewer />} />
                </Routes>
            </main>
        </div>
    );
};

const RedirectToOverview = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/docs/overview', { replace: true });
    }, [navigate]);
    return null;
};

const DocViewer = () => {
    const location = useLocation();
    const docId = location.pathname.split('/').pop() || '';
    const doc = docsMap[docId];

    if (!doc) {
        return <div>Document not found</div>;
    }

    return (
        <div className="markdown-body">
            <ReactMarkdown
                components={{
                    img: ({ node, ...props }) => {
                        return <img {...props} style={{ maxWidth: '100%' }} />
                    },
                    table: ({ node, ...props }) => <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }} {...props} />,
                    th: ({ node, ...props }) => <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f9f9f9', textAlign: 'left' }} {...props} />,
                    td: ({ node, ...props }) => <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />,
                    code: ({ node, ...props }) => <code style={{ backgroundColor: '#f5f5f5', padding: '0.2em 0.4em', borderRadius: '3px', fontSize: '0.9em' }} {...props} />,
                    pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflowX: 'auto' }} {...props} />,
                }}
            >
                {doc.content}
            </ReactMarkdown>
        </div>
    );
};

export default Documentation;
