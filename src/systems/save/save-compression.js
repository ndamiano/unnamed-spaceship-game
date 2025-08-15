export class SaveCompression {
  constructor() {
    this.compressionLevel = 6; // Balance between speed and compression ratio
  }

  /**
   * Compress save data using browser's built-in compression
   * @param {Object} saveData - The save data object to compress
   * @returns {Promise<string>} Base64 encoded compressed data
   */
  async compressSave(saveData) {
    try {
      // Convert to JSON string
      const jsonString = JSON.stringify(saveData);

      // Convert string to Uint8Array
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(jsonString);

      // Compress using gzip
      const compressionStream = new CompressionStream('gzip');
      const writer = compressionStream.writable.getWriter();
      const reader = compressionStream.readable.getReader();

      // Write data to compression stream
      writer.write(data);
      writer.close();

      // Read compressed chunks
      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();

        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      // Combine chunks into single array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const compressedData = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        compressedData.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to base64 for storage
      const base64 = this.arrayBufferToBase64(compressedData);

      const originalSize = new Blob([jsonString]).size;
      const compressedSize = compressedData.length;
      const compressionRatio = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);

      console.log(
        `Save compressed: ${originalSize} bytes → ${compressedSize} bytes (${compressionRatio}% reduction)`
      );

      return {
        compressed: true,
        version: '1.0',
        data: base64,
        originalSize,
        compressedSize,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);

      // Fallback to uncompressed if compression fails
      return {
        compressed: false,
        version: '1.0',
        data: saveData,
        originalSize: new Blob([JSON.stringify(saveData)]).size,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Decompress save data
   * @param {Object} compressedSave - The compressed save object
   * @returns {Promise<Object>} Original save data object
   */
  async decompressSave(compressedSave) {
    try {
      // Handle uncompressed saves (backward compatibility)
      if (!compressedSave.compressed) {
        return compressedSave.data;
      }

      // Convert base64 back to Uint8Array
      const compressedData = this.base64ToArrayBuffer(compressedSave.data);

      // Decompress using gzip
      const decompressionStream = new DecompressionStream('gzip');
      const writer = decompressionStream.writable.getWriter();
      const reader = decompressionStream.readable.getReader();

      // Write compressed data to decompression stream
      writer.write(compressedData);
      writer.close();

      // Read decompressed chunks
      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();

        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      // Combine chunks and decode to string
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const decompressedData = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        decompressedData.set(chunk, offset);
        offset += chunk.length;
      }

      const textDecoder = new TextDecoder();
      const jsonString = textDecoder.decode(decompressedData);

      console.log(
        `Save decompressed: ${compressedSave.compressedSize} bytes → ${decompressedData.length} bytes`
      );

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decompression failed:', error);
      // Try to handle as uncompressed data
      if (typeof compressedSave.data === 'object') {
        return compressedSave.data;
      }

      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {Uint8Array} buffer
   * @returns {string}
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   * @param {string} base64
   * @returns {Uint8Array}
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }

  /**
   * Check if compression is supported by the browser
   * @returns {boolean}
   */
  isCompressionSupported() {
    return (
      typeof CompressionStream !== 'undefined' &&
      typeof DecompressionStream !== 'undefined'
    );
  }

  /**
   * Optimize save data before compression by removing redundant information
   * @param {Object} saveData
   * @returns {Object} Optimized save data
   */
  optimizeSaveData(saveData) {
    const optimized = JSON.parse(JSON.stringify(saveData)); // Deep clone

    // Remove empty arrays and null values
    this.removeEmptyValues(optimized);

    // Optimize ship tiles - already done in your current system
    if (optimized.ship && optimized.ship.tiles) {
      optimized.ship.tiles = optimized.ship.tiles.filter(
        tile => tile && tile.length > 2 // Only keep tiles with actual data
      );
    }

    // Optimize story data
    if (optimized.story) {
      // Convert Sets to Arrays for JSON serialization (already handled)
      if (
        optimized.story.discoveredFragments &&
        Array.isArray(optimized.story.discoveredFragments)
      ) {
        // Remove duplicates
        optimized.story.discoveredFragments = [
          ...new Set(optimized.story.discoveredFragments),
        ];
      }
    }

    return optimized;
  }

  /**
   * Recursively remove empty values from an object
   * @param {Object} obj
   */
  removeEmptyValues(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (value === null || value === undefined) {
        delete obj[key];
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          delete obj[key];
        } else {
          // Clean array elements
          value.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              this.removeEmptyValues(item);
            }
          });
        }
      } else if (typeof value === 'object') {
        this.removeEmptyValues(value);
        // Remove if object became empty
        if (Object.keys(value).length === 0) {
          delete obj[key];
        }
      }
    });
  }

  /**
   * Create a save data header with metadata
   * @param {Object} saveData
   * @returns {Object}
   */
  createSaveHeader(saveData) {
    return {
      version: saveData.version || '1.0.0',
      gameVersion: '1.0.0', // Your game version
      created: saveData.created || new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
      playtime: saveData.player?.totalPlaytime || 0,
      checksum: this.generateChecksum(saveData),
      metadata: {
        playerLevel: this.calculatePlayerLevel(saveData),
        storyProgress: saveData.story?.discoveredFragments?.length || 0,
        roomsExplored: saveData.ship?.tiles?.length || 0,
        gameLayer: saveData.gameLayer || 1,
      },
    };
  }

  /**
   * Generate a simple checksum for save integrity
   * @param {Object} saveData
   * @returns {string}
   */
  generateChecksum(saveData) {
    const str = JSON.stringify(saveData);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);

      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  /**
   * Calculate player level for metadata
   * @param {Object} saveData
   * @returns {number}
   */
  calculatePlayerLevel(saveData) {
    if (!saveData.player?.upgrades) return 1;

    const totalUpgrades = Array.isArray(saveData.player.upgrades)
      ? saveData.player.upgrades.reduce((sum, [_, count]) => sum + count, 0)
      : 0;

    return Math.floor(totalUpgrades / 3) + 1; // Level up every 3 upgrades
  }

  /**
   * Validate save data integrity
   * @param {Object} saveData
   * @param {string} expectedChecksum
   * @returns {boolean}
   */
  validateSaveIntegrity(saveData, expectedChecksum) {
    const actualChecksum = this.generateChecksum(saveData);

    return actualChecksum === expectedChecksum;
  }
}
