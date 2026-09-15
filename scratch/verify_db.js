const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const dummyRecord = {
        hospital_id: '6daf691c-3354-459f-94c5-70fd0e876d28',
        operator_id: '7eb4e1bd-139d-4731-9f2d-625841434cd6',
        procedure_date: '2026-09-15',
        case_status: 'draft',
        anonymous_code: 'TEST-0000',
        centro_medico: 'Hospital de Manises',
        operador: 'Daniel Dubois',
        fecha_procedimiento: '2026-09-15',
        id_paciente: 'TEST-0000',
        vaso_diana: 'DA'
    };
    const { data, error } = await supabase.from('ecrf_opstar_records').insert([dummyRecord]).select();
    if(error) {
        console.log("Insert failed:", error.message);
    } else {
        console.log("Insert succeeded!");
        await supabase.from('ecrf_opstar_records').delete().eq('id', data[0].id);
        console.log("Deleted dummy record.");
    }
})();
