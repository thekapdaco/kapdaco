// src/components/Customize/styles.js

const styles = {
    container: {
        fontFamily: "var(--kc-font-sans)",
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '32px 20px 48px',
        backgroundColor: 'var(--kc-bg)',
        minHeight: '100vh'
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(27,27,27,0.94) 0%, rgba(27,27,27,0.78) 100%)',
        borderRadius: 'var(--kc-radius-lg)',
        boxShadow: 'var(--kc-shadow-md)',
        border: '1px solid rgba(232, 224, 214, 0.18)'
    },

    title: {
        fontSize: '2.6rem',
        fontWeight: '700',
        color: 'var(--kc-bg)',
        margin: 0,
        fontFamily: "var(--kc-font-serif)",
        letterSpacing: '-0.28px'
    },

    stepper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '40px',
        gap: '24px',
        flexWrap: 'wrap'
    },

    stepItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: 0.4,
        transition: 'all 0.3s ease'
    },

    activeStep: { opacity: 1 },
    completedStep: { opacity: 1 },

    stepCircle: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--kc-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        marginBottom: '10px',
        border: '3px solid rgba(27,27,27,0.08)',
        transition: 'all 0.3s ease',
        fontSize: '1rem'
    },

    stepLabel: {
        fontSize: '0.9rem',
        fontWeight: '500',
        textAlign: 'center',
        color: 'var(--kc-ink-2)'
    },

    helpText: {
        backgroundColor: 'rgba(211, 167, 95, 0.12)',
        border: '1px solid rgba(211, 167, 95, 0.35)',
        borderRadius: 'var(--kc-radius)',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center',
        color: 'var(--kc-gold-2)',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        boxShadow: 'var(--kc-shadow-sm)'
    },

    stepContent: {
        backgroundColor: 'var(--kc-surface)',
        borderRadius: 'var(--kc-radius-lg)',
        padding: '48px',
        marginBottom: '30px',
        boxShadow: 'var(--kc-shadow-sm)',
        border: '1px solid var(--kc-border)'
    },

    section: { minHeight: '400px' },

    sectionTitle: {
        fontSize: '2rem',
        fontWeight: '700',
        color: 'var(--kc-ink)',
        marginBottom: '40px',
        textAlign: 'center',
        fontFamily: "var(--kc-font-serif)",
        letterSpacing: '-0.5px'
    },

    centeredContainer: {
        display: 'flex',
        justifyContent: 'center'
    },

    optionsContainerCentered: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        maxWidth: '700px',
        width: '100%'
    },

    stepWithPreview: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '48px',
        alignItems: 'start'
    },

    livePreviewContainer: {
        backgroundColor: 'var(--kc-card)',
        borderRadius: 'var(--kc-radius-lg)',
        padding: '28px',
        position: 'sticky',
        top: '20px',
        height: 'fit-content',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: 'var(--kc-shadow-sm)',
        border: '1px solid var(--kc-border)'
    },

    previewHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px'
    },

    previewTitle: {
        fontSize: '1.3rem',
        fontWeight: '700',
        color: 'var(--kc-ink)',
        margin: 0
    },

    // Update these specific styles in your styles.js file:

    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '28px',
        marginTop: '20px',
        justifyItems: 'center'
    },

    productCard: {
        backgroundColor: 'var(--kc-surface)',
        borderRadius: 'var(--kc-radius)',
        padding: '24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid var(--kc-border)',
        boxShadow: 'var(--kc-shadow-sm)',
        position: 'relative',
        overflow: 'visible',
        width: '100%',
        maxWidth: '320px'
    },

    selectedCard: {
        border: '1px solid var(--kc-gold-1)',
        backgroundColor: 'rgba(211, 167, 95, 0.08)',
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: '0 20px 40px rgba(211, 167, 95, 0.25)'
    },

    productImageWrapper: {
        width: '100%',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        backgroundColor: 'var(--kc-card)',
        borderRadius: '16px',
        overflow: 'hidden'
    },

    productImageCard: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',  // Changed from 'cover' to 'contain'
        padding: '10px'  // Add some padding so image doesn't touch edges
    },

    productName: {
        fontSize: '1.3rem',
        fontWeight: '600',
        color: 'var(--kc-ink)',
        margin: '16px 0 8px 0'
    },

    productPrice: {
        fontSize: '1.6rem',
        fontWeight: '700',
        color: 'var(--kc-gold-1)',
        margin: '12px 0'
    },

    productCategory: {
        fontSize: '0.9rem',
        color: 'var(--kc-ink-2)',
        backgroundColor: 'rgba(27,27,27,0.04)',
        padding: '8px 16px',
        borderRadius: '20px',
        display: 'inline-block',
        textTransform: 'capitalize',
        fontWeight: '500',
        marginTop: '8px'
    },
    optionGroup: {
        backgroundColor: 'var(--kc-card)',
        padding: '28px',
        borderRadius: 'var(--kc-radius)',
        border: '1px solid var(--kc-border)'
    },

    optionTitle: {
        fontSize: '1.2rem',
        fontWeight: '700',
        color: 'var(--kc-ink)',
        marginBottom: '20px'
    },

    sizeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
    },

    sizeButton: {
        padding: '14px 20px',
        border: '1px solid var(--kc-border)',
        borderRadius: '12px',
        backgroundColor: 'var(--kc-surface)',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    selectedButton: {
        border: '1px solid var(--kc-gold-1)',
        backgroundColor: 'var(--kc-gold-1)',
        color: 'var(--kc-ink)',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 12px rgba(211, 167, 95, 0.3)'
    },

    colorGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px'
    },

    colorOption: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        cursor: 'pointer',
        border: '3px solid rgba(27,27,27,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },

    selectedColor: {
        border: '3px solid var(--kc-gold-1)',
        transform: 'scale(1.15)',
        boxShadow: '0 6px 18px rgba(211, 167, 95, 0.35)'
    },

    designContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px'
    },

    designTools: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '28px'
    },

    toolGroup: {
        backgroundColor: 'var(--kc-card)',
        padding: '28px',
        borderRadius: 'var(--kc-radius)',
        border: '1px solid var(--kc-border)'
    },

    toolTitle: {
        fontSize: '1.15rem',
        fontWeight: '700',
        color: 'var(--kc-ink)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center'
    },

    fileInput: {
        width: '100%',
        padding: '14px',
        border: '2px dashed var(--kc-gold-1)',
        borderRadius: '12px',
        backgroundColor: 'var(--kc-surface)',
        cursor: 'pointer',
        fontSize: '0.95rem'
    },

    imagePreviewContainer: {
        position: 'relative',
        marginTop: '20px',
        display: 'inline-block'
    },

    imagePreview: {
        width: '120px',
        height: '120px',
        objectFit: 'cover',
        borderRadius: '12px',
        border: '2px solid var(--kc-border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },

    removeButton: {
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        backgroundColor: 'var(--kc-danger)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        boxShadow: '0 2px 8px rgba(183, 28, 28, 0.35)'
    },

    textInput: {
        width: '100%',
        padding: '14px',
        border: '1px solid var(--kc-border)',
        borderRadius: '12px',
        fontSize: '1rem',
        marginBottom: '20px',
        fontFamily: 'inherit',
        backgroundColor: 'var(--kc-surface)'
    },

    textControls: {
        display: 'grid',
        gap: '20px'
    },

    controlGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
    },

    controlLabel: {
        fontWeight: '600',
        minWidth: '80px',
        fontSize: '0.9rem',
        color: 'var(--kc-ink-2)'
    },

    colorInput: {
        width: '56px',
        height: '40px',
        border: '1px solid var(--kc-border)',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: 'var(--kc-surface)'
    },

    rangeInput: {
        flex: 1,
        minWidth: '120px',
        height: '6px',
        borderRadius: '3px',
        background: 'rgba(27,27,27,0.08)',
        outline: 'none',
        accentColor: 'var(--kc-gold-1)'
    },

    styleButtons: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginTop: '20px'
    },

    styleButton: {
        padding: '12px 20px',
        border: '1px solid var(--kc-border)',
        borderRadius: '10px',
        backgroundColor: 'var(--kc-surface)',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '500',
        transition: 'all 0.3s ease'
    },

    selectedStyleButton: {
        border: '1px solid var(--kc-gold-1)',
        backgroundColor: 'var(--kc-gold-1)',
        color: 'var(--kc-ink)'
    },

    elementControls: {
        backgroundColor: 'rgba(211, 167, 95, 0.1)',
        border: '1px solid rgba(211, 167, 95, 0.4)',
        borderRadius: 'var(--kc-radius-lg)',
        padding: '28px',
        marginTop: '24px',
        boxShadow: 'var(--kc-shadow-sm)'
    },

    advancedControls: {
        display: 'grid',
        gap: '16px',
        marginBottom: '20px'
    },

    controlButtons: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    },

    controlButton: {
        padding: '10px 18px',
        backgroundColor: 'var(--kc-surface)',
        border: '1px solid var(--kc-border)',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--kc-ink-2)'
    },

    viewControls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        flexWrap: 'wrap',
        gap: '16px'
    },

    undoRedoButtons: {
        display: 'flex',
        gap: '10px'
    },

    viewOptions: {
        display: 'flex',
        gap: '10px'
    },

    resetButton: {
        width: '100%',
        padding: '16px',
        backgroundColor: 'var(--kc-danger)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(183, 28, 28, 0.35)'
    },

    previewContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'start'
    },

    previewModeButtons: {
        display: 'flex',
        gap: '10px',
        marginBottom: '24px',
        justifyContent: 'center'
    },

    modeButton: {
        padding: '10px 24px',
        border: '1px solid var(--kc-border)',
        borderRadius: '12px',
        backgroundColor: 'var(--kc-surface)',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.95rem',
        color: 'var(--kc-ink-2)',
        transition: 'all 0.3s ease'
    },

    activeModeButton: {
        border: '1px solid var(--kc-gold-1)',
        backgroundColor: 'var(--kc-gold-1)',
        color: 'var(--kc-ink)',
        boxShadow: '0 4px 12px rgba(211, 167, 95, 0.3)'
    },

    productPreview: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px'
    },

    productMockup: {
        width: '380px',
        height: '480px',
        borderRadius: '16px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(27, 27, 27, 0.22)',
        border: '1px solid var(--kc-border)',
        backgroundColor: 'var(--kc-surface)'
    },

    productSummary: {
        fontSize: '1rem',
        lineHeight: '1.6',
        backgroundColor: 'var(--kc-card)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--kc-border)'
    },

    navigation: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 0',
        borderTop: '1px solid var(--kc-border)',
        marginTop: '32px'
    },

    backButton: {
        padding: '14px 32px',
        backgroundColor: 'transparent',
        border: '1px solid var(--kc-border)',
        borderRadius: '12px',
        color: 'var(--kc-ink-2)',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },

    navigationRight: {
        marginLeft: 'auto'
    },

    nextButton: {
        padding: '14px 32px',
        backgroundColor: 'var(--kc-gold-1)',
        border: 'none',
        borderRadius: '12px',
        color: 'var(--kc-ink)',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(211, 167, 95, 0.32)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    },

    addToCartButton: {
        padding: '16px 40px',
        backgroundColor: 'var(--kc-ink)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 12px 28px rgba(27, 27, 27, 0.28)'
    },
};

export default styles;