import { AdminService } from "./src/service/AdminService";

const service = new AdminService();

async function criarAdmin() {
    const nome = process.argv[2] || "Administrador";
    const email = process.argv[3] || "admin@certoatacado.com.br";
    const senha = process.argv[4] || "admin123";

    try {
        const admin = await service.cadastrar({ nome, email, senha });
        console.log("✅ Admin criado com sucesso!");
        console.log("ID:", admin.id);
        console.log("Nome:", admin.nome);
        console.log("Email:", admin.email);
    } catch (error: any) {
        console.error("❌ Erro ao criar admin:", error.message);
    }
}

criarAdmin();
