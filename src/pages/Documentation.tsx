import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// ============================================================================
// Cache Utilities (5-minute expiry)
// ============================================================================

const CACHE_KEYS = {
    FILES: 'clovalink_docs_files',
    TIMESTAMP: 'clovalink_docs_timestamp',
    CONTENT_PREFIX: 'clovalink_docs_content_',
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const isCacheValid = (): boolean => {
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (!timestamp) return false;
    const cacheTime = parseInt(timestamp, 10);
    return Date.now() - cacheTime < CACHE_DURATION_MS;
};

const getCachedFiles = (): string[] | null => {
    if (!isCacheValid()) return null;
    const files = localStorage.getItem(CACHE_KEYS.FILES);
    return files ? JSON.parse(files) : null;
};

const getCachedContent = (filename: string): string | null => {
    if (!isCacheValid()) return null;
    return localStorage.getItem(CACHE_KEYS.CONTENT_PREFIX + filename);
};

const setCachedFiles = (files: string[]): void => {
    localStorage.setItem(CACHE_KEYS.FILES, JSON.stringify(files));
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
};

const setCachedContent = (filename: string, content: string): void => {
    localStorage.setItem(CACHE_KEYS.CONTENT_PREFIX + filename, content);
};

// ============================================================================
// GitHub API Helpers
// ============================================================================

const GITHUB_REPO = 'ClovaLink/ClovaLink';
const GITHUB_WIKI_PATH = 'docs/wiki';

const fetchFileListFromGitHub = async (): Promise<string[]> => {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_WIKI_PATH}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file list: ${response.status}`);
    }
    const data = await response.json();
    // Filter for .md files and extract names
    return data
        .filter((file: { name: string; type: string }) => file.type === 'file' && file.name.endsWith('.md'))
        .map((file: { name: string }) => file.name);
};

const fetchDocContentFromGitHub = async (filename: string): Promise<string> => {
    const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_WIKI_PATH}/${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
    }
    return response.text();
};

// ============================================================================
// Helper Functions
// ============================================================================

// Convert filename to readable title (e.g., "Admin-Guide.md" -> "Admin Guide")
const filenameToTitle = (filename: string): string => {
    return filename
        .replace('.md', '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ');
};

// Convert filename to URL slug (e.g., "Admin-Guide.md" -> "Admin-Guide")
const filenameToSlug = (filename: string): string => {
    return filename.replace('.md', '');
};

// ============================================================================
// Components
// ============================================================================

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// Skeleton loader for sidebar
const SidebarSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
            <div
                key={i}
                style={{
                    height: '2rem',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '6px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}
            />
        ))}
    </div>
);

// Skeleton loader for content
const ContentSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
            style={{
                height: '2.5rem',
                width: '60%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
            }}
        />
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
                key={i}
                style={{
                    height: '1rem',
                    width: `${80 + Math.random() * 20}%`,
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}
            />
        ))}
    </div>
);

// Error display component
const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div
        style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#666',
        }}
    >
        <p style={{ marginBottom: '1rem' }}>{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                }}
            >
                Try Again
            </button>
        )}
    </div>
);

const Documentation: React.FC = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const loadFiles = async () => {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedFiles = getCachedFiles();
        if (cachedFiles && cachedFiles.length > 0) {
            setFiles(cachedFiles);
            setLoading(false);
            return;
        }

        // Fetch from GitHub
        try {
            const fetchedFiles = await fetchFileListFromGitHub();
            setCachedFiles(fetchedFiles);
            setFiles(fetchedFiles);
        } catch (err) {
            setError('Failed to load documentation. Please try again later.');
            console.error('Error fetching docs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="docs-layout">
            <ScrollToTop />
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
            
            {/* Mobile menu toggle button */}
            <button
                className="docs-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle documentation menu"
            >
                <span style={{ marginRight: '0.5rem' }}>{sidebarOpen ? '✕' : '☰'}</span>
                {sidebarOpen ? 'Close Menu' : 'Docs Menu'}
            </button>

            <aside className={`docs-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Guides</h3>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {loading ? (
                        <SidebarSkeleton />
                    ) : error ? (
                        <ErrorDisplay message="Failed to load" onRetry={loadFiles} />
                    ) : (
                        files.map((filename) => (
                        <NavLink
                                key={filename}
                                to={`/docs/${filenameToSlug(filename)}`}
                            style={({ isActive }) => ({
                                padding: '0.5rem',
                                borderRadius: '6px',
                                color: isActive ? '#000' : '#666',
                                backgroundColor: isActive ? '#f5f5f5' : 'transparent',
                                    fontWeight: isActive ? 600 : 400,
                            })}
                        >
                                {filenameToTitle(filename)}
                        </NavLink>
                        ))
                    )}
                </nav>
            </aside>

            <main className="docs-content">
                <Routes>
                    <Route path="/" element={<RedirectToFirst files={files} loading={loading} />} />
                    <Route path=":docId" element={<DocViewer files={files} />} />
                </Routes>
            </main>
        </div>
    );
};

const RedirectToFirst = ({ files, loading }: { files: string[]; loading: boolean }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && files.length > 0) {
            // Redirect to Home.md if it exists, otherwise first file
            const homeFile = files.find((f) => f.toLowerCase() === 'home.md');
            const firstFile = homeFile || files[0];
            navigate(`/docs/${filenameToSlug(firstFile)}`, { replace: true });
        }
    }, [files, loading, navigate]);

    if (loading) {
        return <ContentSkeleton />;
    }

    return null;
};

const DocViewer = ({ files }: { files: string[] }) => {
    const location = useLocation();
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const docSlug = location.pathname.split('/').pop() || '';
    const filename = docSlug + '.md';

    const loadContent = async () => {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedContent = getCachedContent(filename);
        if (cachedContent) {
            setContent(cachedContent);
            setLoading(false);
            return;
        }

        // Fetch from GitHub
        try {
            const fetchedContent = await fetchDocContentFromGitHub(filename);
            setCachedContent(filename, fetchedContent);
            setContent(fetchedContent);
        } catch (err) {
            setError('Failed to load this document. Please try again later.');
            console.error('Error fetching doc content:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (docSlug) {
            loadContent();
        }
    }, [docSlug]);

    // Check if the document exists in our file list
    const docExists = files.length === 0 || files.some((f) => filenameToSlug(f) === docSlug);

    if (!docExists) {
        return <ErrorDisplay message="Document not found" />;
    }

    if (loading) {
        return <ContentSkeleton />;
    }

    if (error) {
        return <ErrorDisplay message={error} onRetry={loadContent} />;
    }

    if (!content) {
        return <ErrorDisplay message="Document not found" />;
    }

    // Helper to resolve relative paths from wiki folder
    const resolveImageSrc = (src: string): string => {
        if (!src || src.startsWith('http')) return src;
        // Handle relative paths like ../assets/screenshots/dashboard.png
        // From docs/wiki/, ../ goes to docs/
        if (src.startsWith('../')) {
            const resolvedPath = src.replace('../', 'docs/');
            return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${resolvedPath}`;
        }
        // Handle paths relative to wiki folder
        return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_WIKI_PATH}/${src}`;
    };

    // Preprocess content to fix image URLs in raw HTML
    const processedContent = content.replace(
        /src=["'](\.\.\/)([^"']+)["']/g,
        (_, prefix, path) => `src="https://raw.githubusercontent.com/${GITHUB_REPO}/main/docs/${path}"`
    );

    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    img: ({ node, ...props }) => {
                        const src = resolveImageSrc(props.src || '');
                        return <img {...props} src={src} style={{ maxWidth: '100%' }} />;
                    },
                    table: ({ node, ...props }) => (
                        <table
                            style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1rem' }}
                            {...props}
                        />
                    ),
                    th: ({ node, ...props }) => (
                        <th
                            style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                                backgroundColor: '#f9f9f9',
                                textAlign: 'left',
                            }}
                            {...props}
                        />
                    ),
                    td: ({ node, ...props }) => (
                        <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />
                    ),
                    code: ({ node, ...props }) => (
                        <code
                            style={{
                                backgroundColor: '#f5f5f5',
                                padding: '0.2em 0.4em',
                                borderRadius: '3px',
                                fontSize: '0.9em',
                            }}
                            {...props}
                        />
                    ),
                    pre: ({ node, ...props }) => (
                        <pre
                            style={{
                                backgroundColor: '#f5f5f5',
                                padding: '1rem',
                                borderRadius: '6px',
                                overflowX: 'auto',
                            }}
                            {...props}
                        />
                    ),
                    a: ({ node, ...props }) => {
                        // Handle relative links to other docs
                        let href = props.href || '';
                        if (href && !href.startsWith('http') && href.endsWith('.md')) {
                            href = `/docs/${href.replace('.md', '')}`;
                        }
                        return <a {...props} href={href} />;
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default Documentation;
