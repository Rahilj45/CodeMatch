import platform

try:
    platform.machine = lambda: 'AMD64'
    platform.system = lambda: 'Windows'
    platform.win32_ver = lambda *a, **k: ('10', '10.0.22631', 'SP0', 'Multiprocessor Free')
    platform._wmi_query = lambda *a, **k: []
    platform._get_machine_win32 = lambda *a, **k: 'AMD64'
    platform._win32_ver = lambda *a, **k: ('10', '10.0.22631', 'SP0', 'Multiprocessor Free')
except Exception:
    pass
