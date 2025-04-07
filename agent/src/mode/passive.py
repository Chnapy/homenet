# from concurrent import futures
# import grpc
# from agent.grpc.agent_pb2_grpc import AgentServicer, add_AgentServicer_to_server
# from src.grpc.agent_pb2 import AgentInstance, AgentUpdateRequest, AgentUpdateResponse
# from src.exec.local_exec import LocalExec
# from src.exec.ssh_exec import SSHExec
# from src.collect import get_current_instance
# from google.protobuf.json_format import MessageToDict

# class AgentServicerImpl(AgentServicer):
#     def update(self, request, context):
#         return AgentUpdateResponse(foo='bar')

# # Fonction principale pour démarrer le serveur HTTP
# def run(port: int = 8881):
#     server = grpc.server(thread_pool=futures.ThreadPoolExecutor(max_workers=10))

#     add_AgentServicer_to_server(AgentServicerImpl(), server)
#     port = server.add_insecure_port("[::]:50051")
#     server.start()
#     print(f"Agent running on port {port}. Access /device-info to view data.")
#     server.wait_for_termination()

# TODO if needed only
# create grpc message dedicated for passive mode (response should be ~ AgentUpdateRequest)


def run():
    print("Passive mode not implemented")
