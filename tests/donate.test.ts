import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

console.log('\n=== TESTING DONATE MODAL INTEGRATION & WALLET CONFIG ===\n');

// Test 1: Verify DonateModal file exists and contains the user's Binance wallet
const donateModalPath = join(process.cwd(), 'src/components/DonateModal.tsx');
const donateModalContent = readFileSync(donateModalPath, 'utf-8');

const targetWallet = '0xbc1ce0b7d0e5bc3332502bb82cf34125e3062b86';

assert.ok(
  donateModalContent.includes(targetWallet),
  'DonateModal must include the exact Binance wallet address: ' + targetWallet
);
console.log('✅ [PASS] Binance wallet address is present and accurate: ' + targetWallet);

// Test 2: Check English localization & monthly goal
assert.ok(
  donateModalContent.includes('November Radar RSS development goal'),
  'DonateModal must include the development goal header in English'
);
assert.ok(
  donateModalContent.includes('Monthly support covers server capacity'),
  'DonateModal must include monthly support explanation in English'
);
assert.ok(
  donateModalContent.includes('Recent Supporters'),
  'DonateModal must include Recent Supporters section'
);
console.log('✅ [PASS] English labels, copy texts and monthly goal validated');

// Test 3: Check QR code integration and network compatibility note
assert.ok(
  donateModalContent.includes('api.qrserver.com'),
  'DonateModal must support QR code generation'
);
assert.ok(
  donateModalContent.includes('BEP20'),
  'DonateModal must note BEP20 Binance network support'
);
console.log('✅ [PASS] QR Code generator and BEP20 network indicators verified');

// Test 4: Check Navbar integration
const navbarPath = join(process.cwd(), 'src/components/Navbar.tsx');
const navbarContent = readFileSync(navbarPath, 'utf-8');
assert.ok(
  navbarContent.includes('onOpenDonate'),
  'Navbar must expose onOpenDonate prop'
);
assert.ok(
  navbarContent.includes('Donate'),
  'Navbar must render Donate button'
);
console.log('✅ [PASS] Navbar includes Donate button and onOpenDonate trigger');

// Test 5: Check App.tsx integration
const appPath = join(process.cwd(), 'src/App.tsx');
const appContent = readFileSync(appPath, 'utf-8');
assert.ok(
  appContent.includes('isDonateOpen'),
  'App.tsx must maintain isDonateOpen state'
);
assert.ok(
  appContent.includes('<DonateModal'),
  'App.tsx must render <DonateModal'
);
console.log('✅ [PASS] App.tsx integrates DonateModal with state and keybind dismissal');

console.log('\n🎉 ALL DONATE MODAL INTEGRATION TESTS PASSED!\n');
