// src/ui/modal-factory.js
export class ModalFactory {
  static createModal(config) {
    const {
      id,
      icon,
      title,
      subtitle = '',
      contentHTML = '',
      closeButtonText = 'Close',
      closeButtonId = null,
      className = 'story-modal',
      appendTo = null,
    } = config;

    const modal = document.createElement('div');

    modal.id = id;
    modal.className = className;

    const closeId = closeButtonId || `close-${id.replace('-modal', '')}-btn`;

    modal.innerHTML = `
      <div class="story-content">
        <div class="story-header">
          <div class="story-icon">${icon}</div>
          <div class="story-meta">
            <h3 class="story-title">${title}</h3>
            ${subtitle ? `<p class="story-timestamp">${subtitle}</p>` : ''}
          </div>
        </div>
        ${contentHTML}
        <div class="story-actions">
          <button class="btn" id="${closeId}">${closeButtonText}</button>
        </div>
      </div>
    `;

    // Append to specified container or game-container by default
    const container = appendTo || document.getElementById('game-container');

    if (container) {
      container.appendChild(modal);
    }

    return { modal, closeButtonId: closeId };
  }

  static setupModalEvents(modal, closeButtonId, onClose = null) {
    const closeBtn = modal.querySelector(`#${closeButtonId}`);
    const cleanup = [];

    // Close button handler
    if (closeBtn) {
      const closeBtnHandler = () => {
        modal.classList.remove('active');
        if (onClose) onClose();
      };

      closeBtn.addEventListener('click', closeBtnHandler);
      cleanup.push(() =>
        closeBtn.removeEventListener('click', closeBtnHandler)
      );
    }

    // Click outside to close
    const outsideClickHandler = e => {
      if (e.target === modal) {
        modal.classList.remove('active');
        if (onClose) onClose();
      }
    };

    modal.addEventListener('click', outsideClickHandler);
    cleanup.push(() => modal.removeEventListener('click', outsideClickHandler));

    // Escape key to close
    const escapeHandler = e => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        if (onClose) onClose();
      }
    };

    document.addEventListener('keydown', escapeHandler);
    cleanup.push(() => document.removeEventListener('keydown', escapeHandler));

    // Return cleanup function to remove all listeners
    return () => cleanup.forEach(cleanupFn => cleanupFn());
  }

  static showModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
      modal.classList.add('active');

      return true;
    }

    return false;
  }

  static hideModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
      modal.classList.remove('active');

      return true;
    }

    return false;
  }

  static isModalOpen(modalId) {
    const modal = document.getElementById(modalId);

    return modal && modal.classList.contains('active');
  }

  static hideAllModals() {
    const modals = document.querySelectorAll(
      '.story-modal, .upgrade-modal, .settings-modal'
    );

    modals.forEach(modal => modal.classList.remove('active'));
  }
}
